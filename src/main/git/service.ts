import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { promisify } from 'util'
import type { CommitInfo } from '@shared/git'

export type { CommitInfo }

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  status: 'added' | 'modified' | 'deleted' | 'renamed'
}

export type DiffMode = 'all' | 'uncommitted' | 'committed'

const DEFAULT_COMMIT_DEPTH = 10

const MAX_BUFFER = 20 * 1024 * 1024
// Visual cap. Render keeps up via VirtualList in the renderer; AI prompt is bounded separately
// by a char slice in buildDiffPrompt (12k chars).
const MAX_DIFF_LINES = 50_000
const MAX_UNTRACKED_BYTES = 2_000_000
const GIT_TIMEOUT_MS = 15_000

const execFileP = promisify(execFile)

async function git(repoPath: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileP('git', args, {
      cwd: repoPath,
      encoding: 'utf8',
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: MAX_BUFFER
    })
    return stdout.trim()
  } catch (e) {
    const err = e as NodeJS.ErrnoException & {
      stderr?: Buffer | string
      code?: number | string
      status?: number
    }
    const status = typeof err.code === 'number' ? err.code : err.status
    if (status !== 0 && status !== 1) {
      const stderr = err.stderr?.toString().trim() ?? ''
      console.error(
        `[git] failed: git ${args.slice(0, 3).join(' ')} (status=${status}) ${stderr}`
      )
    }
    return ''
  }
}

export function isGitRepo(repoPath: string): boolean {
  return existsSync(join(repoPath, '.git'))
}

export async function getCurrentBranch(repoPath: string): Promise<string> {
  return (
    (await git(repoPath, ['branch', '--show-current'])) ||
    (await git(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD'])) ||
    'HEAD'
  )
}

export async function getCommits(repoPath: string, limit = 20): Promise<CommitInfo[]> {
  const sep = '\x1f'
  const out = await git(repoPath, [
    'log',
    `--max-count=${limit}`,
    `--format=%H${sep}%h${sep}%s${sep}%ci${sep}%an`
  ])
  if (!out) return []
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, short, message, date, author] = line.split(sep)
      return { hash, short, message, date, author }
    })
}

export async function getLocalBranches(repoPath: string): Promise<string[]> {
  const out = await git(repoPath, ['branch', '--format=%(refname:short)'])
  return out ? out.split('\n').filter(Boolean) : []
}

export async function getMergeBase(repoPath: string, ref1: string, ref2: string): Promise<string> {
  return git(repoPath, ['merge-base', ref1, ref2])
}

export async function checkoutBranch(
  repoPath: string,
  branch: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await execFileP('git', ['checkout', branch], {
      cwd: repoPath,
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: MAX_BUFFER
    })
    return { ok: true }
  } catch (e) {
    const err = e as { stderr?: Buffer | string; message?: string }
    const stderr = err.stderr?.toString().trim() ?? err.message ?? 'falha no checkout'
    return { ok: false, error: stderr }
  }
}

async function getCommitTimestamp(repoPath: string, hash: string): Promise<number> {
  if (!hash) return 0
  const out = await git(repoPath, ['show', '-s', '--format=%ct', hash])
  const n = parseInt(out.trim(), 10)
  return Number.isFinite(n) ? n : 0
}

export async function getBaseBranch(repoPath: string, currentBranch: string): Promise<string> {
  const branches = await getLocalBranches(repoPath)
  const candidates = ['main', 'master', 'develop', 'dev'].filter(
    (c) => c !== currentBranch && branches.includes(c)
  )
  if (candidates.length === 0) return ''
  if (candidates.length === 1) return candidates[0]
  // Pick the candidate whose merge-base with HEAD is the most recent —
  // that's the closest fork point and the branch the user most likely
  // branched off from. Avoids picking an older base (e.g. main) when
  // user branched off a newer one (e.g. dev) and pulling in unrelated commits.
  let best = candidates[0]
  let bestTs = -1
  for (const c of candidates) {
    const mb = await getMergeBase(repoPath, c, 'HEAD')
    if (!mb) continue
    const ts = await getCommitTimestamp(repoPath, mb)
    if (ts > bestTs) {
      bestTs = ts
      best = c
    }
  }
  return best
}

async function isLikelyText(repoPath: string, filePath: string): Promise<boolean> {
  try {
    const full = join(repoPath, filePath)
    const s = await stat(full)
    if (s.size > MAX_UNTRACKED_BYTES) return false
    const buf = await readFile(full)
    const limit = Math.min(buf.length, 8000)
    for (let i = 0; i < limit; i++) {
      if (buf[i] === 0) return false
    }
    return true
  } catch {
    return false
  }
}

async function makeUntrackedDiff(repoPath: string, filePath: string): Promise<string> {
  if (!(await isLikelyText(repoPath, filePath))) {
    return [
      `diff --git a/${filePath} b/${filePath}`,
      `new file (binary)`,
      `--- /dev/null`,
      `+++ b/${filePath}`
    ].join('\n')
  }
  try {
    const content = await readFile(join(repoPath, filePath), 'utf8')
    const lines = content.split('\n')
    return [
      `diff --git a/${filePath} b/${filePath}`,
      `new file mode 100644`,
      `--- /dev/null`,
      `+++ b/${filePath}`,
      `@@ -0,0 +1,${lines.length} @@`,
      ...lines.map((l) => '+' + l)
    ].join('\n')
  } catch {
    return ''
  }
}

async function getUntrackedFiles(repoPath: string): Promise<DiffFile[]> {
  const status = await git(repoPath, ['status', '--porcelain', '--untracked-files=all'])
  if (!status) return []
  const paths = status
    .split('\n')
    .filter(Boolean)
    .filter((l) => l.startsWith('??'))
    .map((l) => l.slice(3))

  return Promise.all(
    paths.map(async (filePath): Promise<DiffFile> => {
      let additions = 0
      try {
        const full = join(repoPath, filePath)
        const s = await stat(full)
        if (s.size <= MAX_UNTRACKED_BYTES) {
          const content = await readFile(full, 'utf8')
          additions = content.split('\n').length
        }
      } catch {
        // ignore unreadable files
      }
      return { path: filePath, additions, deletions: 0, status: 'added' }
    })
  )
}

type ResolvedRefs =
  | { kind: 'workingTree' } // git diff HEAD (uncommitted)
  | { kind: 'commitsOnly'; fromHash: string } // git diff <base> HEAD
  | { kind: 'commitsAndWT'; fromHash: string } // git diff <base> (working tree)

async function resolveBaseRef(repoPath: string): Promise<string | null> {
  const current = await getCurrentBranch(repoPath)
  const base = await getBaseBranch(repoPath, current)
  if (!base) return null
  const mergeBase = await getMergeBase(repoPath, base, 'HEAD')
  return mergeBase || null
}

async function resolveDiffRefs(
  repoPath: string,
  mode: DiffMode,
  depth = DEFAULT_COMMIT_DEPTH
): Promise<ResolvedRefs> {
  if (mode === 'uncommitted') return { kind: 'workingTree' }

  const countStr = await git(repoPath, ['rev-list', '--count', 'HEAD'])
  const commitCount = parseInt(countStr || '0', 10)
  if (commitCount <= 1) return { kind: 'workingTree' }

  const useDepth = Math.min(depth, commitCount - 1)
  const depthHash = `HEAD~${useDepth}`

  // Prefer merge-base with base branch (main/master/develop) — shows only commits
  // ahead of base, matching GitHub Desktop semantics.
  const base = await resolveBaseRef(repoPath)
  if (base) {
    const commitsAhead = parseInt(
      await git(repoPath, ['rev-list', '--count', `${base}..HEAD`]),
      10
    )
    if (commitsAhead > 0) {
      return mode === 'committed'
        ? { kind: 'commitsOnly', fromHash: base }
        : { kind: 'commitsAndWT', fromHash: base }
    }
    // Branch has no new commits vs base — nothing to show as "committed".
    // For 'all' fall through to working tree only; for 'committed' return empty range.
    if (mode === 'committed') return { kind: 'commitsOnly', fromHash: 'HEAD' }
    return { kind: 'workingTree' }
  }

  // No base branch detected at all — fall back to recent-commits heuristic.
  return mode === 'committed'
    ? { kind: 'commitsOnly', fromHash: depthHash }
    : { kind: 'commitsAndWT', fromHash: depthHash }
}

function parseNameStatus(out: string): Record<string, DiffFile['status']> {
  const map: Record<string, DiffFile['status']> = {}
  out
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split('\t')
      const code = parts[0][0]
      const filePath = parts[parts.length - 1]
      map[filePath] =
        code === 'A' ? 'added' : code === 'D' ? 'deleted' : code === 'R' ? 'renamed' : 'modified'
    })
  return map
}

function parseNumstat(out: string, statusMap: Record<string, DiffFile['status']>): DiffFile[] {
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [adds, dels, ...pathParts] = line.split('\t')
      const filePath = pathParts.join('\t')
      return {
        path: filePath,
        additions: parseInt(adds, 10) || 0,
        deletions: parseInt(dels, 10) || 0,
        status: statusMap[filePath] ?? 'modified'
      }
    })
}

function truncateDiff(raw: string): string {
  const lines = raw.split('\n')
  if (lines.length > MAX_DIFF_LINES) {
    return (
      lines.slice(0, MAX_DIFF_LINES).join('\n') +
      '\n\n... (diff truncado — muito grande para exibir completo)'
    )
  }
  return raw
}

export async function getProjectDiffData(
  repoPath: string,
  mode: DiffMode = 'all'
): Promise<{ diff: string; files: DiffFile[] }> {
  const refs = await resolveDiffRefs(repoPath, mode)

  if (refs.kind === 'workingTree') {
    // Same as getDiff/getDiffFiles with no fromHash
    const [numstat, nameStatus, rawDiff, untracked] = await Promise.all([
      git(repoPath, ['diff', '--numstat', 'HEAD']),
      git(repoPath, ['diff', '--name-status', 'HEAD']),
      git(repoPath, ['diff', '--unified=4', 'HEAD']),
      getUntrackedFiles(repoPath)
    ])
    const tracked = parseNumstat(numstat, parseNameStatus(nameStatus))
    let diff = rawDiff
    if (untracked.length > 0) {
      const untrackedDiffs = await Promise.all(
        untracked.map((f) => makeUntrackedDiff(repoPath, f.path))
      )
      for (const d of untrackedDiffs) if (d) diff += (diff ? '\n' : '') + d
    }
    return { diff: truncateDiff(diff), files: [...tracked, ...untracked] }
  }

  if (refs.kind === 'commitsOnly') {
    const [numstat, nameStatus, rawDiff] = await Promise.all([
      git(repoPath, ['diff', '--numstat', refs.fromHash, 'HEAD']),
      git(repoPath, ['diff', '--name-status', refs.fromHash, 'HEAD']),
      git(repoPath, ['diff', '--unified=4', refs.fromHash, 'HEAD'])
    ])
    return {
      diff: truncateDiff(rawDiff),
      files: parseNumstat(numstat, parseNameStatus(nameStatus))
    }
  }

  // commitsAndWT: HEAD~N..workingtree (commits + uncommitted + untracked)
  const [numstat, nameStatus, rawDiff, untracked] = await Promise.all([
    git(repoPath, ['diff', '--numstat', refs.fromHash]),
    git(repoPath, ['diff', '--name-status', refs.fromHash]),
    git(repoPath, ['diff', '--unified=4', refs.fromHash]),
    getUntrackedFiles(repoPath)
  ])
  const tracked = parseNumstat(numstat, parseNameStatus(nameStatus))
  let diff = rawDiff
  if (untracked.length > 0) {
    const untrackedDiffs = await Promise.all(
      untracked.map((f) => makeUntrackedDiff(repoPath, f.path))
    )
    for (const d of untrackedDiffs) if (d) diff += (diff ? '\n' : '') + d
  }
  return { diff: truncateDiff(diff), files: [...tracked, ...untracked] }
}

export async function getProjectDiffForFile(
  repoPath: string,
  filePath: string,
  mode: DiffMode = 'all'
): Promise<string> {
  const refs = await resolveDiffRefs(repoPath, mode)
  if (refs.kind === 'workingTree') {
    const diff = await git(repoPath, ['diff', '--unified=4', 'HEAD', '--', filePath])
    if (diff) return diff
    return makeUntrackedDiff(repoPath, filePath)
  }
  if (refs.kind === 'commitsOnly') {
    return git(repoPath, ['diff', '--unified=4', refs.fromHash, 'HEAD', '--', filePath])
  }
  // commitsAndWT
  const diff = await git(repoPath, ['diff', '--unified=4', refs.fromHash, '--', filePath])
  if (diff) return diff
  return makeUntrackedDiff(repoPath, filePath)
}

export async function getDiffFiles(
  repoPath: string,
  fromHash?: string,
  toHash = 'HEAD'
): Promise<DiffFile[]> {
  const numstatArgs = fromHash
    ? ['diff', '--numstat', fromHash, toHash]
    : ['diff', '--numstat', 'HEAD']
  const nameArgs = fromHash
    ? ['diff', '--name-status', fromHash, toHash]
    : ['diff', '--name-status', 'HEAD']

  const [numstat, nameStatus, untracked] = await Promise.all([
    git(repoPath, numstatArgs),
    git(repoPath, nameArgs),
    fromHash ? Promise.resolve<DiffFile[]>([]) : getUntrackedFiles(repoPath)
  ])

  const statusMap: Record<string, DiffFile['status']> = {}
  nameStatus
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split('\t')
      const code = parts[0][0]
      const filePath = parts[parts.length - 1]
      statusMap[filePath] =
        code === 'A' ? 'added' : code === 'D' ? 'deleted' : code === 'R' ? 'renamed' : 'modified'
    })

  const tracked: DiffFile[] = numstat
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [adds, dels, ...pathParts] = line.split('\t')
      const filePath = pathParts.join('\t')
      return {
        path: filePath,
        additions: parseInt(adds, 10) || 0,
        deletions: parseInt(dels, 10) || 0,
        status: statusMap[filePath] ?? 'modified'
      }
    })

  return [...tracked, ...untracked]
}

export async function getDiff(
  repoPath: string,
  fromHash?: string,
  toHash = 'HEAD'
): Promise<string> {
  let raw: string
  if (fromHash) {
    raw = await git(repoPath, ['diff', '--unified=4', fromHash, toHash])
  } else {
    const [tracked, untracked] = await Promise.all([
      git(repoPath, ['diff', '--unified=4', 'HEAD']),
      getUntrackedFiles(repoPath)
    ])
    raw = tracked
    if (untracked.length > 0) {
      const untrackedDiffs = await Promise.all(
        untracked.map((f) => makeUntrackedDiff(repoPath, f.path))
      )
      for (const d of untrackedDiffs) {
        if (d) raw += (raw ? '\n' : '') + d
      }
    }
  }

  const lines = raw.split('\n')
  if (lines.length > MAX_DIFF_LINES) {
    return (
      lines.slice(0, MAX_DIFF_LINES).join('\n') +
      '\n\n... (diff truncado — muito grande para exibir completo)'
    )
  }
  return raw
}

export async function getDiffForFile(
  repoPath: string,
  filePath: string,
  fromHash?: string,
  toHash = 'HEAD'
): Promise<string> {
  if (fromHash) {
    return git(repoPath, ['diff', '--unified=4', fromHash, toHash, '--', filePath])
  }
  // Try direct diff first — covers tracked (modified/staged/deleted) files
  const diff = await git(repoPath, ['diff', '--unified=4', 'HEAD', '--', filePath])
  if (diff) return diff
  // Empty diff = untracked file (or no actual change). Synthesize from disk.
  return makeUntrackedDiff(repoPath, filePath)
}
