import { ipcMain, shell, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { checkForUpdate, downloadUpdateInstaller } from '../update-check'

export function registerUpdateHandlers(): void {
  // Check via GitHub Releases (compara versão, devolve o instalador do SO).
  ipcMain.handle('update:check', () => checkForUpdate())

  // Download DENTRO do app pro ~/Downloads com progresso, e abre o instalador no fim
  // (mac: monta o .dmg pra arrastar · win: roda o setup). Sem mandar pro navegador.
  ipcMain.handle('update:download', async (_, payload: { url: string }) => {
    const url = payload?.url
    if (typeof url !== 'string' || !url) return { ok: false }
    const broadcast = (percent: number, done = false, failed = false): void => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send('update:downloadProgress', { percent, done, failed })
        }
      }
    }
    try {
      const file = await downloadUpdateInstaller(url, (p) => broadcast(p))
      broadcast(100, true)
      await shell.openPath(file)
      return { ok: true }
    } catch (err) {
      console.warn('[update] download in-app falhou:', err instanceof Error ? err.message : err)
      broadcast(0, true, true)
      return { ok: false }
    }
  })

  // Auto-update (Win/Linux): aplica a versão já baixada pelo electron-updater e reinicia.
  ipcMain.handle('update:quitAndInstall', () => {
    try {
      autoUpdater.quitAndInstall()
    } catch (err) {
      console.warn('[update] quitAndInstall falhou:', err)
    }
    return { ok: true as const }
  })
}
