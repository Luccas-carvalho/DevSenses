import { spawnSync } from 'child_process'

export function ensureFullPath(): void {
  if (process.platform !== 'darwin') return
  const shell = process.env.SHELL ?? '/bin/zsh'
  const result = spawnSync(shell, ['-l', '-c', 'echo $PATH'], { encoding: 'utf-8' })
  if (result.status === 0 && result.stdout.trim()) {
    process.env.PATH = result.stdout.trim()
  }
}
