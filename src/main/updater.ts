import { app, dialog, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

let updaterInstalled = false

export function installAutoUpdater(): void {
  if (updaterInstalled) return
  updaterInstalled = true

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false

  autoUpdater.on('error', (err) => {
    console.error('[updater] error', err?.message ?? err)
    notifyRenderer({ type: 'error', message: err?.message ?? String(err) })
  })

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] checking…')
    notifyRenderer({ type: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[updater] available', info?.version)
    notifyRenderer({ type: 'available', version: info?.version })
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] up to date')
    notifyRenderer({ type: 'not-available' })
  })

  autoUpdater.on('download-progress', (p) => {
    notifyRenderer({ type: 'progress', percent: p?.percent ?? 0 })
  })

  autoUpdater.on('update-downloaded', async (info) => {
    console.log('[updater] downloaded', info?.version)
    notifyRenderer({ type: 'downloaded', version: info?.version })
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    if (!win) return
    const { response } = await dialog.showMessageBox(win, {
      type: 'info',
      title: 'Atualização disponível',
      message: `DevSenses ${info?.version} foi baixada.`,
      detail: 'Reiniciar agora pra aplicar?',
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1
    })
    if (response === 0) {
      autoUpdater.quitAndInstall()
    }
  })

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch((e) => {
      console.error('[updater] check failed', e)
    })
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(() => {})
    }, 60 * 60 * 1000)
  }
}

function notifyRenderer(payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('updater:event', payload)
  }
}
