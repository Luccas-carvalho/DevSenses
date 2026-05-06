import { gitRun } from './ops'

export async function createBranch(
  repoPath: string,
  name: string,
  baseRef = 'HEAD',
  checkout = true
): Promise<{ ok: boolean; error?: string }> {
  if (!/^[\w./-]+$/.test(name)) return { ok: false, error: 'Nome inválido (use a-z, 0-9, /, -, _, .)' }
  const args = checkout ? ['checkout', '-b', name, baseRef] : ['branch', name, baseRef]
  const r = await gitRun(repoPath, args)
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function deleteBranch(
  repoPath: string,
  name: string,
  opts: { force?: boolean; remote?: boolean } = {}
): Promise<{ ok: boolean; error?: string }> {
  if (opts.remote) {
    const r = await gitRun(repoPath, ['push', 'origin', '--delete', name], 60_000)
    if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
    return { ok: true }
  }
  const flag = opts.force ? '-D' : '-d'
  const r = await gitRun(repoPath, ['branch', flag, name])
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function renameBranch(
  repoPath: string,
  oldName: string,
  newName: string
): Promise<{ ok: boolean; error?: string }> {
  if (!/^[\w./-]+$/.test(newName)) return { ok: false, error: 'Nome inválido' }
  const r = await gitRun(repoPath, ['branch', '-m', oldName, newName])
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function mergeBranch(
  repoPath: string,
  from: string,
  strategy: 'merge' | 'squash' | 'rebase' = 'merge'
): Promise<{ ok: boolean; output?: string; error?: string }> {
  let r
  if (strategy === 'rebase') {
    r = await gitRun(repoPath, ['rebase', from], 60_000)
  } else if (strategy === 'squash') {
    r = await gitRun(repoPath, ['merge', '--squash', from], 60_000)
  } else {
    r = await gitRun(repoPath, ['merge', '--no-ff', from], 60_000)
  }
  if (!r.ok) return { ok: false, output: r.stdout, error: r.stderr || r.stdout }
  return { ok: true, output: r.stdout }
}

export async function abortMerge(repoPath: string): Promise<{ ok: boolean; error?: string }> {
  const r = await gitRun(repoPath, ['merge', '--abort'])
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function abortRebase(repoPath: string): Promise<{ ok: boolean; error?: string }> {
  const r = await gitRun(repoPath, ['rebase', '--abort'])
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}

export async function continueMerge(
  repoPath: string,
  message?: string
): Promise<{ ok: boolean; error?: string }> {
  const args = ['commit']
  if (message?.trim()) {
    args.push('-m', message.trim())
  } else {
    args.push('--no-edit')
  }
  const r = await gitRun(repoPath, args)
  if (!r.ok) return { ok: false, error: r.stderr || r.stdout }
  return { ok: true }
}
