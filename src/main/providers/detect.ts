import { spawnSync } from 'child_process'

const isWin = process.platform === 'win32'
const lookupCmd = isWin ? 'where' : 'which'

export function findBinary(name: string): string | null {
  const result = spawnSync(lookupCmd, [name], { encoding: 'utf-8' })
  if (result.status !== 0) return null
  const out = (result.stdout || '').trim().split(/\r?\n/)[0]
  return out || null
}

export async function detectVersion(binary: string, args: string[] = ['--version']): Promise<string | null> {
  const result = spawnSync(binary, args, { encoding: 'utf-8', timeout: 5_000 })
  if (result.status !== 0) return null
  const text = (result.stdout || result.stderr || '').trim()
  const match = text.match(/(\d+\.\d+\.\d+|\d+\.\d+|\d+)/)
  return match ? match[1] : text.slice(0, 40) || null
}
