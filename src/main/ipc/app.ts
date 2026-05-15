import { ipcMain, app, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { IpcContract } from '@shared/ipc-contract'

export function registerAppHandlers(): void {
  ipcMain.handle('app:getVersion', async () => {
    return { version: app.getVersion(), name: app.getName() }
  })

  ipcMain.handle('app:checkForUpdates', async () => {
    if (!app.isPackaged) {
      return { ok: false, error: 'updates indisponiveis em dev' }
    }
    try {
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('app:openExternal', async (_, payload: IpcContract['app:openExternal']['request']) => {
    try {
      await shell.openExternal(payload.url)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
