import { execFile } from 'child_process'
import { promisify } from 'util'
import type {
  RepoStatus,
  FileStatus,
  StatusKind,
  CommitInfoExtended,
  StashEntry
} from '@shared/git'

const execFileP = promisify(execFile)
const MAX_BUFFER = 20 * 1024 * 1024
const TIMEOUT_LONG = 60_000
const TIMEOUT_SHORT = 15_000

export interface GitResult {
  ok: boolean
  stdout: string
  stderr: string
  exitCode: number
}

export async function gitRun(
  repoPath: string,
  args: string[],
  timeout = TIMEOUT_SHORT
): Promise<GitResult> {
  try {
    const { stdout, stderr } = await execFileP('git', args, {
      cwd: repoPath,
      encoding: 'utf8',
      timeout,
      maxBuffer: MAX_BUFFER
    })
    return { ok: true, stdout: String(stdout), stderr: String(stderr ?? ''), exitCode: 0 }
  } catch (e) {
    const err = e as NodeJS.ErrnoException & {
      stderr?: Buffer | string
      stdout?: Buffer | string
      code?: number | string
    }
    return {
      ok: false,
      stdout: err.stdout ? String(err.stdout) : '',
      stderr: err.stderr ? String(err.stderr) : (err.message ?? ''),
      exitCode: typeof err.code === 'number' ? err.code : 1
    }
  }
}

function parseStatusKind(code: string): StatusKind | null {
  switch (code) {
    case 'M':
      return 'modified'
    case 'A':
      return 'added'
    case 'D':
      return 'deleted'
    case 'R':
      return 'renamed'
    case 'C':
      return 'copied'
    case '?':
      return 'untracked'
    case '!':
      return 'ignored'
    case 'U':
      return 'conflicted'
    case ' ':
      return null
    default:
      return null
  }
}

function parsePorcelain(out: string): FileStatus[] {
  const result: FileStatus[] = []
  const lines = out.split('\n')
  for (const line of lines) {
    if (!line) continue
    const x = line[0]
    const y = line[1]
    const rest = line.slice(3)
    if (x === '?' && y === '?') {
      result.push({ path: rest, staged: null, unstaged: 'untracked' })
      continue
    }
    if (x === '!' && y === '!') {
      result.push({ path: rest, staged: null, unstaged: 'ignored' })
      continue
    }
    let path = rest
    let oldPath: string | undefined
    if (x === 'R' || y === 'R' || x === 'C' || y === 'C') {
      const arrow = rest.indexOf(' -> ')
      if (arrow >= 0) {
        oldPath = rest.slice(0, arrow)
        path = rest.slice(arrow + 4)
      }
    }
    const conflicted = (x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D'))
    if (conflicted) {
      result.push({ path, oldPath, staged: 'conflicted', unstaged: 'conflicted' })
      continue
    }
    result.push({
      path,
      oldPath,
      staged: parseStatusKind(x),
      unstaged: parseStatusKind(y)
    })
  }
  return result
}

export async function getRepoStatus(repoPath: string): Promise<RepoStatus> {
  const branchOut = await gitRun(repoPath, ['branch', '--show-current'])
  const branch = branchOut.stdout.trim() || 'HEAD'
  const upstreamOut = await gitRun(repoPath, [
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{u}'
  ])
  const upstream = upstreamOut.ok ? upstreamOut.stdout.trim() : null

  let ahead = 0
  let behind = 0
  if (upstream) {
    const ab = await gitRun(repoPath, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`])
    if (ab.ok) {
      const parts = ab.stdout.trim().split(/\s+/)
      behind = parseInt(parts[0] ?? '0', 10) || 0
      ahead = parseInt(parts[1] ?? '0', 10) || 0
    }
  }

  const isMerging = (await gitRun(repoPath, ['rev-parse', '--verify', 'MERGE_HEAD'])).ok
  const rebaseDir = (await gitRun(repoPath, ['rev-parse', '--git-path', 'rebase-merge'])).stdout.trim()
  const rebaseDir2 = (await gitRun(repoPath, ['rev-parse', '--git-path', 'rebase-apply'])).stdout.trim()
  const fs = await import('fs')
  const isRebasing =
    (rebaseDir && fs.existsSync(rebaseDir)) || (rebaseDir2 && fs.existsSync(rebaseDir2))

  const statusOut = await gitRun(repoPath, ['status', '--porcelain', '-uall'])
  const files = statusOut.ok ? parsePorcelain(statusOut.stdout) : []

  return { branch, upstream, ahead, behind, isMerging: !!isMerging, isRebasing: !!isRebasing, files }
}

export async function stageFiles(repoPath: string, files: string[]): Promise<GitResult> {
  if (files.length === 0) return { ok: true, stdout: '', stderr: '', exitCode: 0 }
  return gitRun(repoPath, ['add', '--', ...files])
}

export async function unstageFiles(repoPath: string, files: string[]): Promise<GitResult> {
  if (files.length === 0) return { ok: true, stdout: '', stderr: '', exitCode: 0 }
  return gitRun(repoPath, ['reset', 'HEAD', '--', ...files])
}

export async function commit(
  repoPath: string,
  summary: string,
  description?: string,
  amend = false
): Promise<{ ok: boolean; hash?: string; error?: string }> {
  const args = ['commit']
  if (amend) args.push('--amend')
  args.push('-m', summary)
  if (description?.trim()) args.push('-m', description.trim())
  const r = await gitRun(repoPath, args)
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  const hashOut = await gitRun(repoPath, ['rev-parse', 'HEAD'])
  return { ok: true, hash: hashOut.stdout.trim() }
}

export async function undoLastCommit(
  repoPath: string
): Promise<{ ok: boolean; error?: string }> {
  const parentR = await gitRun(repoPath, ['rev-parse', '--verify', 'HEAD~1'])
  if (!parentR.ok) {
    return { ok: false, error: 'Sem commit anterior pra desfazer (HEAD inicial).' }
  }
  const r = await gitRun(repoPath, ['reset', '--mixed', 'HEAD~1'])
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function lastCommit(
  repoPath: string
): Promise<{ hash: string; subject: string; body: string } | null> {
  const sep = '\u0001'
  const r = await gitRun(repoPath, [
    'log',
    '-1',
    `--format=%H${sep}%s${sep}%b`
  ])
  if (!r.ok || !r.stdout.trim()) return null
  const [hash, subject, body] = r.stdout.trim().split(sep)
  return { hash, subject: subject ?? '', body: (body ?? '').trim() }
}

export async function push(
  repoPath: string,
  opts: { force?: boolean; setUpstream?: boolean } = {}
): Promise<{ ok: boolean; output?: string; error?: string }> {
  const args = ['push']
  if (opts.setUpstream) {
    const branch = (await gitRun(repoPath, ['branch', '--show-current'])).stdout.trim()
    args.push('--set-upstream', 'origin', branch)
  }
  if (opts.force) args.push('--force-with-lease')
  const r = await gitRun(repoPath, args, TIMEOUT_LONG)
  if (!r.ok) {
    const raw = r.stderr || r.stdout
    const lower = raw.toLowerCase()
    if (
      lower.includes('non-fast-forward') ||
      lower.includes('rejected') ||
      lower.includes('fetch first') ||
      lower.includes('updates were rejected')
    ) {
      return {
        ok: false,
        output: r.stdout,
        error:
          'Remote tem commits novos que tu não tem. Faz Pull primeiro pra trazer as mudanças, depois Push.\n\n' +
          raw
      }
    }
    if (lower.includes('no upstream') || lower.includes('has no upstream')) {
      return {
        ok: false,
        output: r.stdout,
        error:
          'Branch sem upstream configurado. Usa "Publicar branch" pra criar no remoto primeiro.\n\n' +
          raw
      }
    }
    return { ok: false, output: r.stdout, error: raw }
  }
  return { ok: true, output: r.stderr || r.stdout }
}

export async function pull(
  repoPath: string,
  opts: { rebase?: boolean } = {}
): Promise<{ ok: boolean; output?: string; error?: string }> {
  const args = ['pull']
  if (opts.rebase) args.push('--rebase')
  const r = await gitRun(repoPath, args, TIMEOUT_LONG)
  if (!r.ok) {
    const raw = r.stderr || r.stdout
    const lower = raw.toLowerCase()
    if (lower.includes('no tracking information') || lower.includes('no upstream')) {
      return {
        ok: false,
        output: r.stdout,
        error:
          'Branch sem upstream configurado. Configura com: git push -u origin <branch> ou usa "Publicar branch".\n\n' +
          raw
      }
    }
    if (lower.includes('refusing to merge unrelated histories')) {
      return {
        ok: false,
        output: r.stdout,
        error:
          'Histórias não relacionadas. Repos foram inicializados separados — precisa de --allow-unrelated-histories manual.\n\n' +
          raw
      }
    }
    if (lower.includes('uncommitted changes') || lower.includes('your local changes')) {
      return {
        ok: false,
        output: r.stdout,
        error:
          'Tem alterações não commitadas que conflitam com o pull. Commita ou Stash antes.\n\n' +
          raw
      }
    }
    if (lower.includes('conflict')) {
      return {
        ok: false,
        output: r.stdout,
        error:
          'Pull gerou conflito. Resolve os conflitos e finaliza o merge.\n\n' + raw
      }
    }
    return { ok: false, output: r.stdout, error: raw }
  }
  return { ok: true, output: r.stderr || r.stdout }
}

export async function fetch(
  repoPath: string,
  opts: { prune?: boolean } = {}
): Promise<{ ok: boolean; output?: string; error?: string }> {
  const args = ['fetch']
  if (opts.prune) args.push('--prune')
  const r = await gitRun(repoPath, args, TIMEOUT_LONG)
  if (!r.ok) return { ok: false, output: r.stdout, error: r.stderr || r.stdout }
  return { ok: true, output: r.stderr || r.stdout }
}

export async function aheadBehind(
  repoPath: string
): Promise<{ ahead: number; behind: number; upstream: string | null }> {
  const upstreamOut = await gitRun(repoPath, [
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{u}'
  ])
  if (!upstreamOut.ok) return { ahead: 0, behind: 0, upstream: null }
  const upstream = upstreamOut.stdout.trim()
  const ab = await gitRun(repoPath, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`])
  if (!ab.ok) return { ahead: 0, behind: 0, upstream }
  const parts = ab.stdout.trim().split(/\s+/)
  return {
    behind: parseInt(parts[0] ?? '0', 10) || 0,
    ahead: parseInt(parts[1] ?? '0', 10) || 0,
    upstream
  }
}

export async function appendGitignore(
  repoPath: string,
  patterns: string[]
): Promise<{ ok: boolean; error?: string }> {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const file = path.join(repoPath, '.gitignore')
  try {
    let existing = ''
    try {
      existing = await fs.readFile(file, 'utf8')
    } catch {
      existing = ''
    }
    const existingLines = new Set(
      existing
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
    )
    const toAdd = patterns.filter((p) => !existingLines.has(p.trim()))
    if (toAdd.length === 0) return { ok: true }
    const sep = existing.length > 0 && !existing.endsWith('\n') ? '\n' : ''
    const block = sep + toAdd.join('\n') + '\n'
    await fs.appendFile(file, block, 'utf8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function discardAll(
  repoPath: string,
  includeUntracked = false
): Promise<{ ok: boolean; error?: string }> {
  const r1 = await gitRun(repoPath, ['restore', '--worktree', '--staged', '.'])
  if (!r1.ok) {
    const r1b = await gitRun(repoPath, ['checkout', '--', '.'])
    if (!r1b.ok) return { ok: false, error: r1b.stderr || r1.stderr }
    await gitRun(repoPath, ['reset', 'HEAD'])
  }
  if (includeUntracked) {
    const r2 = await gitRun(repoPath, ['clean', '-fd'])
    if (!r2.ok) return { ok: false, error: r2.stderr || r2.stdout }
  }
  return { ok: true }
}

export async function discardFile(
  repoPath: string,
  file: string
): Promise<{ ok: boolean; error?: string }> {
  const r = await gitRun(repoPath, ['checkout', 'HEAD', '--', file])
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function logExtended(
  repoPath: string,
  opts: { limit?: number; skip?: number; branch?: string } = {}
): Promise<CommitInfoExtended[]> {
  const sep = '\x1f'
  const args = ['log', `--max-count=${opts.limit ?? 50}`]
  if (opts.skip) args.push(`--skip=${opts.skip}`)
  args.push(`--format=%H${sep}%h${sep}%s${sep}%ci${sep}%an${sep}%ae${sep}%D`)
  if (opts.branch) args.push(opts.branch)
  const r = await gitRun(repoPath, args)
  if (!r.ok) return []
  return r.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, short, message, date, author, email, refsStr] = line.split(sep)
      const refs = refsStr ? refsStr.split(',').map((s) => s.trim()).filter(Boolean) : []
      return { hash, short, message, date, author, email, refs }
    })
}

export async function diffForCommit(
  repoPath: string,
  hash: string
): Promise<{ diff: string; files: { path: string; additions: number; deletions: number; status: 'added' | 'modified' | 'deleted' | 'renamed' }[] }> {
  const diffR = await gitRun(repoPath, ['show', '--format=', '--no-color', hash])
  const numstat = await gitRun(repoPath, [
    'show',
    '--format=',
    '--numstat',
    '--name-status',
    hash
  ])
  const files: { path: string; additions: number; deletions: number; status: 'added' | 'modified' | 'deleted' | 'renamed' }[] = []
  if (numstat.ok) {
    const lines = numstat.stdout.split('\n').filter(Boolean)
    const statusMap: Record<string, 'added' | 'modified' | 'deleted' | 'renamed'> = {}
    for (const l of lines) {
      const parts = l.split('\t')
      if (parts.length >= 2 && /^[A-Z]/.test(parts[0])) {
        const code = parts[0][0]
        const path = parts[parts.length - 1]
        const s: 'added' | 'modified' | 'deleted' | 'renamed' =
          code === 'A' ? 'added' : code === 'D' ? 'deleted' : code === 'R' ? 'renamed' : 'modified'
        statusMap[path] = s
      } else if (parts.length === 3 && /^\d+|^-/.test(parts[0])) {
        const adds = parseInt(parts[0], 10) || 0
        const dels = parseInt(parts[1], 10) || 0
        const path = parts[2]
        files.push({
          path,
          additions: adds,
          deletions: dels,
          status: statusMap[path] ?? 'modified'
        })
      }
    }
  }
  return { diff: diffR.stdout, files }
}

export async function listStashes(repoPath: string): Promise<StashEntry[]> {
  const sep = '\x1f'
  const r = await gitRun(repoPath, ['stash', 'list', `--format=%gd${sep}%s${sep}%ci`])
  if (!r.ok || !r.stdout) return []
  return r.stdout
    .split('\n')
    .filter(Boolean)
    .map((line, i) => {
      const [, msg, date] = line.split(sep)
      const branchMatch = msg?.match(/^WIP on ([^:]+):/)
      const branch = branchMatch ? branchMatch[1] : ''
      const cleanMsg = msg?.replace(/^WIP on [^:]+:\s*/, '').replace(/^On [^:]+:\s*/, '') ?? ''
      return { index: i, branch, message: cleanMsg, date }
    })
}

export async function stashSave(
  repoPath: string,
  message?: string,
  includeUntracked = false
): Promise<{ ok: boolean; error?: string }> {
  const args = ['stash', 'push']
  if (includeUntracked) args.push('-u')
  if (message?.trim()) args.push('-m', message.trim())
  const r = await gitRun(repoPath, args)
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function stashOp(
  repoPath: string,
  op: 'pop' | 'apply' | 'drop',
  index: number
): Promise<{ ok: boolean; error?: string }> {
  const r = await gitRun(repoPath, ['stash', op, `stash@{${index}}`])
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function branchesDetailed(
  repoPath: string
): Promise<{
  name: string
  isCurrent: boolean
  lastCommitDate: string
  lastCommitMessage: string
  upstream: string | null
}[]> {
  const sep = '\x1f'
  const r = await gitRun(repoPath, [
    'for-each-ref',
    `--format=%(refname:short)${sep}%(HEAD)${sep}%(committerdate:iso8601)${sep}%(contents:subject)${sep}%(upstream:short)`,
    'refs/heads'
  ])
  if (!r.ok) return []
  return r.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, head, date, message, upstream] = line.split(sep)
      return {
        name,
        isCurrent: head.trim() === '*',
        lastCommitDate: date,
        lastCommitMessage: message ?? '',
        upstream: upstream?.trim() || null
      }
    })
}

export async function recentCheckouts(
  repoPath: string,
  limit = 20
): Promise<string[]> {
  // Parse reflog "checkout: moving from X to Y" — pega Y (branch destino)
  const r = await gitRun(repoPath, [
    'reflog',
    '--pretty=format:%gs',
    `-n`,
    String(limit * 4)
  ])
  if (!r.ok) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const line of r.stdout.split('\n')) {
    const m = line.match(/^checkout: moving from .+ to (.+)$/)
    if (!m) continue
    const branch = m[1].trim()
    // Filtra commits SHA (40 chars hex) — só mantém branch names
    if (/^[0-9a-f]{7,40}$/.test(branch)) continue
    if (seen.has(branch)) continue
    seen.add(branch)
    out.push(branch)
    if (out.length >= limit) break
  }
  return out
}

export async function prPreview(
  repoPath: string,
  base: string,
  head: string
): Promise<{
  commitCount: number
  additions: number
  deletions: number
  files: { path: string; additions: number; deletions: number; status: 'added' | 'modified' | 'deleted' | 'renamed' }[]
  commits: { hash: string; short: string; message: string; date: string; author: string }[]
}> {
  const sep = '\x1f'
  const range = `${base}...${head}`
  const logR = await gitRun(repoPath, [
    'log',
    `--format=%H${sep}%h${sep}%s${sep}%ci${sep}%an`,
    range
  ])
  const commits = logR.ok
    ? logR.stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hash, short, message, date, author] = line.split(sep)
          return { hash, short, message, date, author }
        })
    : []

  const numstatR = await gitRun(repoPath, ['diff', '--numstat', range])
  let additions = 0
  let deletions = 0
  const files: { path: string; additions: number; deletions: number; status: 'added' | 'modified' | 'deleted' | 'renamed' }[] = []
  if (numstatR.ok) {
    const lines = numstatR.stdout.split('\n').filter(Boolean)
    for (const l of lines) {
      const parts = l.split('\t')
      if (parts.length === 3) {
        const a = parseInt(parts[0], 10) || 0
        const d = parseInt(parts[1], 10) || 0
        const path = parts[2]
        additions += a
        deletions += d
        files.push({ path, additions: a, deletions: d, status: 'modified' })
      }
    }
  }

  const nameStatusR = await gitRun(repoPath, ['diff', '--name-status', range])
  if (nameStatusR.ok) {
    const map: Record<string, 'added' | 'modified' | 'deleted' | 'renamed'> = {}
    for (const l of nameStatusR.stdout.split('\n').filter(Boolean)) {
      const parts = l.split('\t')
      if (parts.length >= 2) {
        const code = parts[0][0]
        const path = parts[parts.length - 1]
        map[path] =
          code === 'A' ? 'added' : code === 'D' ? 'deleted' : code === 'R' ? 'renamed' : 'modified'
      }
    }
    for (const f of files) {
      if (map[f.path]) f.status = map[f.path]
    }
  }

  return { commitCount: commits.length, additions, deletions, files, commits }
}

export async function diffRange(
  repoPath: string,
  base: string,
  head: string,
  file?: string
): Promise<{ diff: string }> {
  const args = ['diff', '--no-color', `${base}...${head}`]
  if (file) args.push('--', file)
  const r = await gitRun(repoPath, args)
  return { diff: r.stdout }
}

export async function canMerge(
  repoPath: string,
  base: string,
  head: string
): Promise<{ canMerge: boolean; reason: string | null }> {
  const r = await gitRun(repoPath, ['merge-tree', '--write-tree', base, head])
  if (!r.ok) {
    if (/conflict/i.test(r.stderr) || /conflict/i.test(r.stdout)) {
      return { canMerge: false, reason: 'Há conflitos entre as branches.' }
    }
    return { canMerge: false, reason: r.stderr || r.stdout || 'Falha ao verificar merge.' }
  }
  if (/<<<<<<< |\+<<<<<<< /m.test(r.stdout)) {
    return { canMerge: false, reason: 'Há conflitos entre as branches.' }
  }
  return { canMerge: true, reason: null }
}

export async function getRemoteUrl(
  repoPath: string,
  remote = 'origin'
): Promise<{
  url: string | null
  webUrl: string | null
  owner: string | null
  repo: string | null
  host: string | null
}> {
  const r = await gitRun(repoPath, ['config', '--get', `remote.${remote}.url`])
  const url = r.ok ? r.stdout.trim() : ''
  if (!url) return { url: null, webUrl: null, owner: null, repo: null, host: null }
  const ssh = url.match(/^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/)
  const https = url.match(/^https?:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/)
  const m = ssh ?? https
  if (!m) return { url, webUrl: null, owner: null, repo: null, host: null }
  const host = m[1]
  const owner = m[2]
  const repo = m[3]
  return { url, host, owner, repo, webUrl: `https://${host}/${owner}/${repo}` }
}
