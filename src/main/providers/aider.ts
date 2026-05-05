import { spawn } from 'child_process'
import type { AIProvider, InvokeOptions } from './types'
import { detectVersion } from './detect'

export const aiderProvider: AIProvider = {
  id: 'aider',
  binary() {
    return 'aider'
  },
  buildArgs({ prompt, testMode }) {
    const base = ['--no-pretty', '--yes-always', '--no-auto-commits', '--no-stream']
    if (testMode) return [...base, '--message', 'Reply with exactly: ok']
    return [...base, '--message', prompt]
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
      if (msg.trim()) console.error('[aider stderr]', msg)
    })
    child.on('error', (err) => opts.onError(err))
    child.on('close', (code) => {
      if (code === 0) opts.onDone()
      else opts.onError(new Error(`aider saiu com codigo ${code}`))
    })
  }
}
