import { spawnSync } from 'child_process'
import { existsSync, statSync, constants, accessSync } from 'fs'
import path from 'path'

const isWin = process.platform === 'win32'
const lookupCmd = isWin ? 'where' : 'which'

function isExecutable(file: string): boolean {
  try {
    if (!existsSync(file)) return false
    const st = statSync(file)
    if (!st.isFile()) return false
    if (isWin) return true
    accessSync(file, constants.X_OK)
    return true
  } catch {
    return false
  }
}

function scanPath(name: string): string | null {
  const pathEnv = process.env.PATH || ''
  const sep = isWin ? ';' : ':'
  const exts = isWin ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : ['']
  for (const dir of pathEnv.split(sep).filter(Boolean)) {
    for (const ext of exts) {
      const candidate = path.join(dir, name + ext.toLowerCase())
      if (isExecutable(candidate)) return candidate
      const candidateUpper = path.join(dir, name + ext)
      if (isExecutable(candidateUpper)) return candidateUpper
    }
  }
  return null
}

export function findBinary(name: string): string | null {
  const result = spawnSync(lookupCmd, [name], { encoding: 'utf-8' })
  if (result.status === 0) {
    const out = (result.stdout || '').trim().split(/\r?\n/)[0]
    if (out && isExecutable(out)) return out
  }
  return scanPath(name)
}

export async function detectVersion(
  binary: string,
  args: string[] = ['--version']
): Promise<string | null> {
  const result = spawnSync(binary, args, { encoding: 'utf-8', timeout: 5_000 })
  if (result.status !== 0) return null
  const text = (result.stdout || result.stderr || '').trim()
  const match = text.match(/(\d+\.\d+\.\d+|\d+\.\d+|\d+)/)
  return match ? match[1] : text.slice(0, 40) || null
}
