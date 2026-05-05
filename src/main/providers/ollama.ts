import { spawn } from 'child_process'
import type { AIProvider, InvokeOptions } from './types'
import { detectVersion } from './detect'

const DEFAULT_MODEL = 'llama3.2'

export const ollamaProvider: AIProvider = {
  id: 'ollama',
  binary() {
    return 'ollama'
  },
  buildArgs({ prompt, testMode }) {
    if (testMode) return ['run', DEFAULT_MODEL, 'Reply with exactly: ok']
    return ['run', DEFAULT_MODEL, prompt]
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
      if (msg.trim()) console.error('[ollama stderr]', msg)
    })
    child.on('error', (err) => opts.onError(err))
    child.on('close', (code) => {
      if (code === 0) opts.onDone()
      else opts.onError(new Error(`ollama saiu com codigo ${code}`))
    })
  }
}
