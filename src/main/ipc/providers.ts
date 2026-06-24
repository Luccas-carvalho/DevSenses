import { ipcMain, BrowserWindow } from 'electron'
import type { IpcContract } from '@shared/ipc-contract'
import { PROVIDER_IDS, PROVIDER_META, type ProviderId, type ProviderStatus } from '@shared/providers'
import { findBinary } from '../providers/detect'
import { PROVIDERS } from '../providers/registry'
import { listModels } from '../providers/models'

async function detectAll(): Promise<Record<ProviderId, ProviderStatus>> {
  const out: Record<string, ProviderStatus> = {}
  for (const id of PROVIDER_IDS) {
    const meta = PROVIDER_META[id]
    const path = findBinary(meta.binaryName)
    let version: string | null = null
    if (path) {
      try {
        version = await PROVIDERS[id].detectVersion(path)
      } catch {
        version = null
      }
    }
    out[id] = { installed: !!path, binaryPath: path, version }
  }
  return out as Record<ProviderId, ProviderStatus>
}

const TEST_TIMEOUT_MS = 15_000

async function testProvider(id: ProviderId): Promise<{ ok: boolean; latencyMs: number; error: string | null }> {
  const provider = PROVIDERS[id]
  const meta = PROVIDER_META[id]
  const bin = findBinary(meta.binaryName)
  if (!bin) {
    return { ok: false, latencyMs: 0, error: `binario "${meta.binaryName}" nao encontrado` }
  }

  return new Promise((resolve) => {
    const start = Date.now()
    let output = ''
    const ac = new AbortController()
    const timer = setTimeout(() => {
      ac.abort()
      resolve({ ok: false, latencyMs: Date.now() - start, error: 'timeout 15s' })
    }, TEST_TIMEOUT_MS)

    provider.invoke({
      prompt: 'Reply with exactly: ok',
      onChunk: (c) => {
        output += c
      },
      onDone: () => {
        clearTimeout(timer)
        const latencyMs = Date.now() - start
        const lower = output.toLowerCase()
        const ok = lower.includes('ok')
        resolve({ ok, latencyMs, error: ok ? null : `resposta inesperada: ${output.slice(0, 100)}` })
      },
      onError: (err) => {
        clearTimeout(timer)
        resolve({ ok: false, latencyMs: Date.now() - start, error: err.message })
      },
      abortSignal: ac.signal
    })
  })
}

const activeStreams = new Map<string, AbortController>()

export function registerProviderHandlers(): void {
  ipcMain.handle('providers:detect', async () => {
    return detectAll()
  })

  ipcMain.handle('providers:listModels', async () => {
    return listModels()
  })

  ipcMain.handle('providers:test', async (_, payload: IpcContract['providers:test']['request']) => {
    return testProvider(payload.id)
  })

  ipcMain.handle('providers:invoke', async (event, payload: IpcContract['providers:invoke']['request']) => {
    const { id, prompt, streamId } = payload
    const provider = PROVIDERS[id]
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const ac = new AbortController()
    activeStreams.set(streamId, ac)

    const send = (chunk: string, done: boolean, error: string | null): void => {
      win.webContents.send('providers:stream', { streamId, chunk, done, error })
    }

    provider.invoke({
      prompt,
      onChunk: (c) => send(c, false, null),
      onDone: () => {
        activeStreams.delete(streamId)
        send('', true, null)
      },
      onError: (err) => {
        activeStreams.delete(streamId)
        send('', true, err.message)
      },
      abortSignal: ac.signal
    })
  })

  ipcMain.handle('providers:abort', (_, payload: IpcContract['providers:abort']['request']) => {
    const ac = activeStreams.get(payload.streamId)
    if (ac) {
      ac.abort()
      activeStreams.delete(payload.streamId)
    }
  })
}
