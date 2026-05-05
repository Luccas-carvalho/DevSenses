import { ipcMain, dialog, BrowserWindow, app, Menu } from 'electron'
import { basename } from 'path'
import { watch as fsWatch, type FSWatcher } from 'fs'
import { getDb } from '../db/connection'
import {
  isGitRepo,
  getCommits,
  getDiff,
  getCurrentBranch,
  getDiffFiles,
  getDiffForFile,
  getProjectDiffData,
  getProjectDiffForFile,
  getLocalBranches,
  checkoutBranch,
  type DiffMode
} from '../git/service'

type WatcherEntry = { watcher: FSWatcher; timer: NodeJS.Timeout | null }
const watchers = new Map<number, WatcherEntry>()

function stopWatcher(webContentsId: number): void {
  const entry = watchers.get(webContentsId)
  if (entry) {
    if (entry.timer) clearTimeout(entry.timer)
    try {
      entry.watcher.close()
    } catch {
      // ignore
    }
    watchers.delete(webContentsId)
  }
}

const NOISY_PATH_FRAGMENTS = [
  '.git/',
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  '.turbo/',
  '.vite/',
  '.cache/',
  'coverage/',
  '.DS_Store'
]

function isNoisyPath(filename: string): boolean {
  for (const f of NOISY_PATH_FRAGMENTS) {
    if (filename.includes(f)) return true
  }
  return filename.endsWith('.log') || filename.endsWith('.lock')
}

function refreshDockMenu(): void {
  if (process.platform !== 'darwin') return
  try {
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT path, name FROM recent_workspaces
         ORDER BY last_opened_at DESC LIMIT 8`
      )
      .all() as { path: string; name: string }[]

    const template: Electron.MenuItemConstructorOptions[] =
      rows.length > 0
        ? [
            { label: 'Projetos recentes', enabled: false },
            { type: 'separator' },
            ...rows.map((r) => ({
              label: r.name || basename(r.path),
              click: (): void => {
                const win = BrowserWindow.getAllWindows()[0]
                if (win) {
                  if (win.isMinimized()) win.restore()
                  win.focus()
                  win.webContents.send('app:open-project', { path: r.path })
                }
              }
            }))
          ]
        : [{ label: 'Sem projetos recentes', enabled: false }]

    app.dock?.setMenu(Menu.buildFromTemplate(template))
  } catch (err) {
    console.error('[dock] failed to set menu:', err)
  }
}

export function registerWorkspaceHandlers(): void {
  ipcMain.handle('workspace:pickFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const path = result.filePaths[0]
    const name = basename(path)

    const db = getDb()
    db.prepare(
      `
      INSERT INTO recent_workspaces (path, name, last_opened_at)
      VALUES (?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET name = excluded.name, last_opened_at = excluded.last_opened_at
    `
    ).run(path, name, Date.now())

    try {
      app.addRecentDocument(path)
    } catch {
      // ignore
    }
    refreshDockMenu()

    return { path, name }
  })

  ipcMain.handle('workspace:recent', () => {
    const db = getDb()
    const rows = db
      .prepare(
        `
      SELECT path, name, last_opened_at as lastOpenedAt
      FROM recent_workspaces
      ORDER BY last_opened_at DESC
      LIMIT 10
    `
      )
      .all() as { path: string; name: string; lastOpenedAt: number }[]
    return rows
  })

  ipcMain.handle(
    'workspace:openProject',
    async (_event, payload: { path: string; mode?: DiffMode }) => {
      const { path, mode = 'all' } = payload
      if (!isGitRepo(path)) {
        return {
          valid: false,
          branch: '',
          baseBranch: '',
          mergeBase: '',
          commits: [],
          diff: '',
          files: []
        }
      }
      // Track in macOS recent documents + bump in DB
      try {
        const db = getDb()
        db.prepare(
          `INSERT INTO recent_workspaces (path, name, last_opened_at)
           VALUES (?, ?, ?)
           ON CONFLICT(path) DO UPDATE SET last_opened_at = excluded.last_opened_at`
        ).run(path, basename(path), Date.now())
        app.addRecentDocument(path)
        refreshDockMenu()
      } catch {
        // ignore
      }
      const [branch, commits, projectData] = await Promise.all([
        getCurrentBranch(path),
        getCommits(path, 20),
        getProjectDiffData(path, mode)
      ])
      return {
        valid: true,
        branch,
        baseBranch: '',
        mergeBase: '',
        commits,
        diff: projectData.diff,
        files: projectData.files
      }
    }
  )

  ipcMain.handle(
    'workspace:getDiff',
    async (_, payload: { path: string; fromHash?: string; toHash?: string }) => {
      const diff = await getDiff(payload.path, payload.fromHash, payload.toHash)
      return { diff }
    }
  )

  ipcMain.handle('workspace:getCommits', async (_, payload: { path: string; limit?: number }) => {
    return getCommits(payload.path, payload.limit ?? 20)
  })

  ipcMain.handle(
    'workspace:getDiffForFile',
    async (
      _,
      payload: {
        path: string
        filePath: string
        fromHash?: string
        toHash?: string
        mode?: DiffMode
      }
    ) => {
      // Prefer mode-based when provided; else fall back to fromHash/toHash
      if (payload.mode) {
        const diff = await getProjectDiffForFile(payload.path, payload.filePath, payload.mode)
        return { diff }
      }
      const diff = await getDiffForFile(
        payload.path,
        payload.filePath,
        payload.fromHash,
        payload.toHash
      )
      return { diff }
    }
  )

  ipcMain.handle(
    'workspace:getDiffFiles',
    async (_, payload: { path: string; fromHash?: string; toHash?: string }) => {
      return getDiffFiles(payload.path, payload.fromHash, payload.toHash)
    }
  )

  ipcMain.handle('workspace:watch', (event, payload: { path: string }) => {
    const id = event.sender.id
    stopWatcher(id)

    let timer: NodeJS.Timeout | null = null
    let watcher: FSWatcher
    try {
      // Native fs.watch — uses FSEvents on macOS, ReadDirectoryChanges on Windows.
      // Recursive option supported on darwin/win32; falls back gracefully on linux.
      watcher = fsWatch(
        payload.path,
        { recursive: true, persistent: true },
        (_eventType, filename) => {
          if (!filename) return
          const f = filename.toString()
          if (isNoisyPath(f)) return

          if (timer) clearTimeout(timer)
          timer = setTimeout(() => {
            const entry = watchers.get(id)
            if (entry) entry.timer = null
            if (!event.sender.isDestroyed()) {
              event.sender.send('workspace:changed', { path: payload.path })
            }
          }, 400)
        }
      )
    } catch (err) {
      console.error('[watcher] failed to start:', err)
      return
    }

    watcher.on('error', (err) => {
      console.error('[watcher] error:', err)
    })

    watchers.set(id, { watcher, timer })
    event.sender.once('destroyed', () => stopWatcher(id))
  })

  ipcMain.handle('workspace:unwatch', (event) => {
    stopWatcher(event.sender.id)
  })

  ipcMain.handle('workspace:getBranches', async (_, payload: { path: string }) => {
    return getLocalBranches(payload.path)
  })

  ipcMain.handle(
    'workspace:checkoutBranch',
    async (_, payload: { path: string; branch: string }) => {
      return checkoutBranch(payload.path, payload.branch)
    }
  )
}
