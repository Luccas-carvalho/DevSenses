import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import { detectEditors, openInEditor, detectTerminals, openInTerminal } from '../system/editors'
import type { IpcContract } from '@shared/ipc-contract'

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
