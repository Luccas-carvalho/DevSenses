import { useToastStore, type ToastTone } from '@/stores/toast'

/**
 * Notifica o fim de uma tarefa. Fora de foco → notificação nativa do SO (main);
 * em foco → toast in-app. Respeita o setting `notifications_enabled`. Best-effort.
 */
export async function notifyEvent(opts: {
  title: string
  body: string
  tone?: ToastTone
  target?: string
}): Promise<void> {
  try {
    const enabled = await window.api.invoke('settings:get', { key: 'notifications_enabled' })
    if (enabled === false) return
    const res = await window.api.invoke('notify:show', {
      title: opts.title,
      body: opts.body,
      target: opts.target
    })
    if (!res.shown) {
      useToastStore.getState().push({ title: opts.title, body: opts.body, tone: opts.tone ?? 'success' })
    }
  } catch {
    // best-effort — nunca quebra o fluxo principal.
  }
}
