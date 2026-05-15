import { spawnSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import path from 'path'

function shellResolvedPath(): string | null {
  const shell = process.env.SHELL || '/bin/zsh'
  const shellName = path.basename(shell)

  let cmd: string
  if (shellName === 'zsh') {
    cmd = '[ -f ~/.zshrc ] && source ~/.zshrc >/dev/null 2>&1; echo "__DS_PATH__:$PATH"'
  } else if (shellName === 'bash') {
    cmd = '[ -f ~/.bashrc ] && source ~/.bashrc >/dev/null 2>&1; echo "__DS_PATH__:$PATH"'
  } else if (shellName === 'fish') {
    cmd = 'echo "__DS_PATH__:$PATH" | string replace -a " " ":"'
  } else {
    cmd = 'echo "__DS_PATH__:$PATH"'
  }

  try {
    const result = spawnSync(shell, ['-l', '-c', cmd], { encoding: 'utf-8', timeout: 5_000 })
    if (result.status !== 0) return null
    const out = result.stdout || ''
    const line = out.split('\n').reverse().find((l) => l.includes('__DS_PATH__:'))
    if (!line) return null
    return line.split('__DS_PATH__:')[1]?.trim() || null
  } catch {
    return null
  }
}

function commonBinDirs(home: string): string[] {
  const dirs: string[] = [
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    '/usr/local/bin',
    '/usr/local/sbin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
    path.join(home, '.local', 'bin'),
    path.join(home, 'bin'),
    path.join(home, '.npm-global', 'bin'),
    path.join(home, '.npm', 'bin'),
    path.join(home, '.yarn', 'bin'),
    path.join(home, '.pnpm'),
    path.join(home, '.bun', 'bin'),
    path.join(home, '.deno', 'bin'),
    path.join(home, '.volta', 'bin'),
    path.join(home, '.cargo', 'bin'),
    path.join(home, '.pyenv', 'shims'),
    path.join(home, '.rbenv', 'shims'),
    path.join(home, 'Library', 'pnpm'),
    path.join(home, '.claude', 'local'),
    path.join(home, '.codeium', 'bin'),
    '/Applications/Ollama.app/Contents/Resources'
  ]

  const nvmRoot = path.join(home, '.nvm', 'versions', 'node')
  if (existsSync(nvmRoot)) {
    try {
      for (const v of readdirSync(nvmRoot)) {
        dirs.push(path.join(nvmRoot, v, 'bin'))
      }
    } catch {
      // ignore
    }
  }

  const fnmRoot = path.join(home, '.local', 'share', 'fnm', 'node-versions')
  if (existsSync(fnmRoot)) {
    try {
      for (const v of readdirSync(fnmRoot)) {
        dirs.push(path.join(fnmRoot, v, 'installation', 'bin'))
      }
    } catch {
      // ignore
    }
  }

  return dirs
}

export function ensureFullPath(): void {
  if (process.platform === 'win32') return

  const home = homedir()
  const segments = new Set<string>()

  const current = process.env.PATH || ''
  for (const p of current.split(':').filter(Boolean)) segments.add(p)

  const shellPath = shellResolvedPath()
  if (shellPath) {
    for (const p of shellPath.split(':').filter(Boolean)) segments.add(p)
  }

  for (const dir of commonBinDirs(home)) {
    if (existsSync(dir)) segments.add(dir)
  }

  process.env.PATH = [...segments].join(':')
}
