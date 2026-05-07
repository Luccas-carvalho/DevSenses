import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { detectEditors, openInEditor, detectTerminals, openInTerminal } from '../system/editors'
import type { IpcContract } from '@shared/ipc-contract'

const execFileP = promisify(execFile)

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  avif: 'image/avif'
}

function mimeForFile(file: string): string | null {
  const ext = file.split('.').pop()?.toLowerCase() ?? ''
  return MIME_BY_EXT[ext] ?? null
}

const MAX_BLOB_BYTES = 25 * 1024 * 1024

export function registerRepositoryHandlers(): void {
  ipcMain.handle('editors:detect', async () => {
    return detectEditors()
  })
  ipcMain.handle('terminals:detect', async () => {
    return detectTerminals()
  })

  ipcMain.handle('repository:openInEditor', async (_, p: IpcContract['repository:openInEditor']['request']) => {
    return openInEditor(p.path, { file: p.file, line: p.line, editorId: p.editorId })
  })
  ipcMain.handle('repository:openInTerminal', async (_, p: IpcContract['repository:openInTerminal']['request']) => {
    return openInTerminal(p.path, p.terminalId)
  })
  ipcMain.handle('repository:openInFinder', async (_, p: IpcContract['repository:openInFinder']['request']) => {
    try {
      if (p.file) {
        shell.showItemInFolder(`${p.path}/${p.file}`)
      } else {
        await shell.openPath(p.path)
      }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  })
  ipcMain.handle('repository:openUrl', async (_, p: IpcContract['repository:openUrl']['request']) => {
    try {
      await shell.openExternal(p.url)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  })

  ipcMain.handle('repository:fileBlob', async (_, p: IpcContract['repository:fileBlob']['request']) => {
    const mime = mimeForFile(p.file)
    try {
      if (p.ref) {
        const { stdout } = await execFileP('git', ['show', `${p.ref}:${p.file}`], {
          cwd: p.path,
          encoding: 'buffer',
          timeout: 15_000,
          maxBuffer: MAX_BLOB_BYTES + 1024
        })
        const buf = stdout as Buffer
        if (buf.length > MAX_BLOB_BYTES) {
          return { exists: true, base64: null, size: buf.length, mime }
        }
        return { exists: true, base64: buf.toString('base64'), size: buf.length, mime }
      }
      const abs = join(p.path, p.file)
      const stat = await fs.stat(abs)
      if (!stat.isFile()) return { exists: false, base64: null, size: 0, mime }
      if (stat.size > MAX_BLOB_BYTES) {
        return { exists: true, base64: null, size: stat.size, mime }
      }
      const buf = await fs.readFile(abs)
      return { exists: true, base64: buf.toString('base64'), size: stat.size, mime }
    } catch {
      return { exists: false, base64: null, size: 0, mime }
    }
  })

  ipcMain.handle('repository:pickFolder', async (_, p: IpcContract['repository:pickFolder']['request']) => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      title: p?.title ?? 'Escolher pasta',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return { path: result.filePaths[0] }
  })
}
