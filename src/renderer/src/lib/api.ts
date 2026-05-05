import type { ProviderId } from '@shared/providers'

export async function streamProvider(opts: {
  id: ProviderId
  prompt: string
  onChunk: (chunk: string) => void
  onDone: (error: string | null) => void
}): Promise<{ abort: () => void }> {
  const streamId = crypto.randomUUID()

  const off = window.api.on('providers:stream', (data) => {
    if (data.streamId !== streamId) return
    if (data.done) {
      off()
      opts.onDone(data.error)
    } else {
      opts.onChunk(data.chunk)
    }
  })

  await window.api.invoke('providers:invoke', { id: opts.id, prompt: opts.prompt, streamId })

  return {
    abort: () => {
      window.api.invoke('providers:abort', { streamId })
      off()
    }
  }
}
