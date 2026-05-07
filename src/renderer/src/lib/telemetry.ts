export function track(event: string, payload?: Record<string, unknown>): void {
  try {
    window.api.invoke('telemetry:track', { event, payload }).catch(() => {})
  } catch {
    /* noop */
  }
}
