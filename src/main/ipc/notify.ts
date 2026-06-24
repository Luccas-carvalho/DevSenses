import { ipcMain, BrowserWindow, Notification } from 'electron'

/**
 * Notificação nativa do SO. Só dispara quando a janela está FORA de foco — se o
 * usuário está olhando o app, devolve `shown:false` e o renderer mostra um toast
 * in-app. Clicar na notificação foca o app (e manda `notify:click` pro renderer).
 */
export function registerNotifyHandlers(): void {
  ipcMain.handle(
    'notify:show',
    (_, payload: { title: string; body: string; target?: string }) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win?.isFocused()) return { shown: false } // em foco → renderer faz o toast
      if (!Notification.isSupported()) return { shown: false }

      const n = new Notification({ title: payload.title, body: payload.body })
      n.on('click', () => {
        const w = BrowserWindow.getAllWindows()[0]
        if (!w) return
        if (w.isMinimized()) w.restore()
        w.show()
        w.focus()
        if (payload.target) w.webContents.send('notify:click', { target: payload.target })
      })
      n.show()
      return { shown: true }
    }
  )
}
