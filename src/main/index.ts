import { app, shell, BrowserWindow, Menu } from 'electron'
import { join, basename } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { ensureFullPath } from './utils/path-fix'
import { getDb, closeDb } from './db/connection'
import { runEmbeddedMigrations } from './db/migrations'
import { registerIpcHandlers } from './ipc'
import { installAppMenu } from './app-menu'
import { installAutoUpdater } from './updater'

ensureFullPath()

app.setName('DevSenses')

function openProjectInRenderer(path: string): void {
  const wins = BrowserWindow.getAllWindows()
  const target = wins[0] ?? null
  if (target) {
    target.webContents.send('app:open-project', { path })
    if (target.isMinimized()) target.restore()
    target.focus()
  } else {
    pendingProjectOpen = path
    createWindow()
  }
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

    const items = rows.map((r) => ({
      label: r.name || basename(r.path),
      click: (): void => openProjectInRenderer(r.path)
    }))

    const template: Electron.MenuItemConstructorOptions[] =
      items.length > 0
        ? [
            { label: 'Projetos recentes', enabled: false },
            { type: 'separator' },
            ...items
          ]
        : [{ label: 'Sem projetos recentes', enabled: false }]

    app.dock?.setMenu(Menu.buildFromTemplate(template))
  } catch (err) {
    console.error('[dock] failed to set menu:', err)
  }
}

let pendingProjectOpen: string | null = null

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    title: 'DevSenses',
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (pendingProjectOpen) {
      const path = pendingProjectOpen
      pendingProjectOpen = null
      mainWindow.webContents.send('app:open-project', { path })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.luccas.devsenses')

  if (process.platform === 'darwin' && app.dock) {
    try {
      app.dock.setIcon(icon)
    } catch (e) {
      console.error('[dock] setIcon failed', e)
    }
  }

  const db = getDb()
  const ran = runEmbeddedMigrations(db)
  if (ran.length > 0) {
    console.log(`[migrations] applied: ${ran.join(', ')}`)
  }

  registerIpcHandlers()
  installAppMenu()
  refreshDockMenu()
  installAutoUpdater()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDb()
})
