import { execFile } from 'child_process'
import { promisify } from 'util'
import { join, basename } from 'path'
import { existsSync, mkdirSync, readdirSync } from 'fs'
import { gitRun } from './ops'

const execFileP = promisify(execFile)
const TIMEOUT_CLONE = 5 * 60 * 1000

function deriveRepoName(url: string): string {
  const m = url.match(/[/:]([\w.-]+?)(\.git)?\/?$/)
  return m?.[1] ?? 'repo'
}

export async function cloneRepo(
  url: string,
  destDir: string
): Promise<{ ok: boolean; path?: string; error?: string }> {
  if (!url.trim()) return { ok: false, error: 'URL vazia' }
  if (!destDir.trim()) return { ok: false, error: 'Pasta destino vazia' }
  const name = deriveRepoName(url)
  const target = join(destDir, name)
  if (existsSync(target)) {
    if (existsSync(join(target, '.git'))) return { ok: true, path: target }
    if (readdirSync(target).length > 0) {
      return { ok: false, error: `Pasta já existe e não é vazia: ${target}` }
    }
  } else {
    mkdirSync(target, { recursive: true })
  }
  try {
    await execFileP('git', ['clone', url, target], {
      timeout: TIMEOUT_CLONE,
      maxBuffer: 50 * 1024 * 1024
    })
    return { ok: true, path: target }
  } catch (e) {
    const err = e as Error & { stderr?: string }
    return { ok: false, error: err.stderr ?? err.message }
  }
}

export async function initRepo(
  destDir: string,
  initialBranch?: string
): Promise<{ ok: boolean; path?: string; error?: string }> {
  if (!destDir.trim()) return { ok: false, error: 'Pasta destino vazia' }
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
  if (existsSync(join(destDir, '.git'))) return { ok: true, path: destDir }
  const args = ['init']
  if (initialBranch?.trim()) args.push('-b', initialBranch.trim())
  const r = await gitRun(destDir, args)
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true, path: destDir }
}

export function projectName(p: string): string {
  return basename(p)
}
