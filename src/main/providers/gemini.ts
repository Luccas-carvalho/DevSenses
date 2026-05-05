import { spawn } from 'child_process'
import type { AIProvider, InvokeOptions } from './types'
import { detectVersion } from './detect'

export const geminiProvider: AIProvider = {
  id: 'gemini',
  binary() {
    return 'gemini'
  },
  buildArgs({ prompt, testMode }) {
    if (testMode) return ['-p', 'Reply with exactly: ok']
    return ['-p', prompt]
  },
  detectVersion(bin) {
    return detectVersion(bin, ['--version'])
  },
  async invoke(opts: InvokeOptions) {
    const args = this.buildArgs({ prompt: opts.prompt })
    const child = spawn(this.binary(), args, { stdio: ['ignore', 'pipe', 'pipe'] })

    if (opts.abortSignal) {
      opts.abortSignal.addEventListener('abort', () => child.kill('SIGTERM'))
    }

    child.stdout.on('data', (d: Buffer) => opts.onChunk(d.toString('utf-8')))
    child.stderr.on('data', (d: Buffer) => {
      const msg = d.toString('utf-8')
      if (msg.trim()) console.error('[gemini stderr]', msg)
    })
    child.on('error', (err) => opts.onError(err))
    child.on('close', (code) => {
      if (code === 0) opts.onDone()
      else opts.onError(new Error(`gemini saiu com codigo ${code}`))
    })
  }
}
