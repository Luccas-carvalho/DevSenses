import { app, BrowserWindow } from 'electron'
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

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[updater] downloaded', info?.version)
    // Sem diálogo nativo — o UpdateModal (renderer) mostra o estado "reiniciar".
    notifyRenderer({ type: 'downloaded', version: info?.version })
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
