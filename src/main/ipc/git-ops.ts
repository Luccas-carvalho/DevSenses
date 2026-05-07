import { ipcMain } from 'electron'
import * as ops from '../git/ops'
import * as branches from '../git/branches'
import * as cloneOps from '../git/clone'
import { gitRun } from '../git/ops'
import type { IpcContract } from '@shared/ipc-contract'

export function registerGitHandlers(): void {
  ipcMain.handle('git:status', async (_, p: IpcContract['git:status']['request']) => {
    return ops.getRepoStatus(p.path)
  })
  ipcMain.handle('git:stageFiles', async (_, p: IpcContract['git:stageFiles']['request']) => {
    const r = await ops.stageFiles(p.path, p.files)
    return r.ok ? { ok: true } : { ok: false, error: r.stderr || r.stdout }
  })
  ipcMain.handle('git:unstageFiles', async (_, p: IpcContract['git:unstageFiles']['request']) => {
    const r = await ops.unstageFiles(p.path, p.files)
    return r.ok ? { ok: true } : { ok: false, error: r.stderr || r.stdout }
  })
  ipcMain.handle('git:commit', async (_, p: IpcContract['git:commit']['request']) => {
    return ops.commit(p.path, p.summary, p.description, p.amend)
  })
  ipcMain.handle(
    'git:undoLastCommit',
    async (_, p: IpcContract['git:undoLastCommit']['request']) => {
      return ops.undoLastCommit(p.path)
    }
  )
  ipcMain.handle('git:lastCommit', async (_, p: IpcContract['git:lastCommit']['request']) => {
    return ops.lastCommit(p.path)
  })
  ipcMain.handle('git:push', async (_, p: IpcContract['git:push']['request']) => {
    return ops.push(p.path, { force: p.force, setUpstream: p.setUpstream })
  })
  ipcMain.handle('git:pull', async (_, p: IpcContract['git:pull']['request']) => {
    return ops.pull(p.path, { rebase: p.rebase })
  })
  ipcMain.handle('git:fetch', async (_, p: IpcContract['git:fetch']['request']) => {
    return ops.fetch(p.path, { prune: p.prune })
  })
  ipcMain.handle('git:aheadBehind', async (_, p: IpcContract['git:aheadBehind']['request']) => {
    return ops.aheadBehind(p.path)
  })

  ipcMain.handle('git:createBranch', async (_, p: IpcContract['git:createBranch']['request']) => {
    return branches.createBranch(p.path, p.name, p.baseRef ?? 'HEAD', p.checkout ?? true)
  })
  ipcMain.handle('git:deleteBranch', async (_, p: IpcContract['git:deleteBranch']['request']) => {
    return branches.deleteBranch(p.path, p.name, { force: p.force, remote: p.remote })
  })
  ipcMain.handle('git:renameBranch', async (_, p: IpcContract['git:renameBranch']['request']) => {
    return branches.renameBranch(p.path, p.oldName, p.newName)
  })
  ipcMain.handle('git:mergeBranch', async (_, p: IpcContract['git:mergeBranch']['request']) => {
    return branches.mergeBranch(p.path, p.from, p.strategy)
  })
  ipcMain.handle('git:abortMerge', async (_, p: IpcContract['git:abortMerge']['request']) => {
    return branches.abortMerge(p.path)
  })
  ipcMain.handle('git:abortRebase', async (_, p: IpcContract['git:abortRebase']['request']) => {
    return branches.abortRebase(p.path)
  })
  ipcMain.handle('git:continueMerge', async (_, p: IpcContract['git:continueMerge']['request']) => {
    return branches.continueMerge(p.path, p.message)
  })

  ipcMain.handle('git:discardAll', async (_, p: IpcContract['git:discardAll']['request']) => {
    return ops.discardAll(p.path, p.includeUntracked)
  })
  ipcMain.handle('git:discardFile', async (_, p: IpcContract['git:discardFile']['request']) => {
    return ops.discardFile(p.path, p.file)
  })
  ipcMain.handle('git:appendGitignore', async (_, p: IpcContract['git:appendGitignore']['request']) => {
    return ops.appendGitignore(p.path, p.patterns)
  })

  ipcMain.handle('git:stash', async (_, p: IpcContract['git:stash']['request']) => {
    return ops.stashSave(p.path, p.message, p.includeUntracked)
  })
  ipcMain.handle('git:stashList', async (_, p: IpcContract['git:stashList']['request']) => {
    return ops.listStashes(p.path)
  })
  ipcMain.handle('git:stashPop', async (_, p: IpcContract['git:stashPop']['request']) => {
    return ops.stashOp(p.path, 'pop', p.index)
  })
  ipcMain.handle('git:stashApply', async (_, p: IpcContract['git:stashApply']['request']) => {
    return ops.stashOp(p.path, 'apply', p.index)
  })
  ipcMain.handle('git:stashDrop', async (_, p: IpcContract['git:stashDrop']['request']) => {
    return ops.stashOp(p.path, 'drop', p.index)
  })

  ipcMain.handle('git:logExtended', async (_, p: IpcContract['git:logExtended']['request']) => {
    return ops.logExtended(p.path, { limit: p.limit, skip: p.skip, branch: p.branch })
  })
  ipcMain.handle('git:diffForCommit', async (_, p: IpcContract['git:diffForCommit']['request']) => {
    return ops.diffForCommit(p.path, p.hash)
  })
  ipcMain.handle('git:remoteUrl', async (_, p: IpcContract['git:remoteUrl']['request']) => {
    return ops.getRemoteUrl(p.path, p.remote)
  })
  ipcMain.handle('git:prPreview', async (_, p: IpcContract['git:prPreview']['request']) => {
    return ops.prPreview(p.path, p.base, p.head)
  })
  ipcMain.handle('git:diffRange', async (_, p: IpcContract['git:diffRange']['request']) => {
    return ops.diffRange(p.path, p.base, p.head, p.file)
  })
  ipcMain.handle('git:canMerge', async (_, p: IpcContract['git:canMerge']['request']) => {
    return ops.canMerge(p.path, p.base, p.head)
  })
  ipcMain.handle(
    'git:branchesDetailed',
    async (_, p: IpcContract['git:branchesDetailed']['request']) => {
      return ops.branchesDetailed(p.path)
    }
  )
  ipcMain.handle(
    'git:recentCheckouts',
    async (_, p: IpcContract['git:recentCheckouts']['request']) => {
      return ops.recentCheckouts(p.path, p.limit)
    }
  )

  ipcMain.handle('git:clone', async (_, p: IpcContract['git:clone']['request']) => {
    return cloneOps.cloneRepo(p.url, p.dest)
  })
  ipcMain.handle('git:init', async (_, p: IpcContract['git:init']['request']) => {
    return cloneOps.initRepo(p.dest, p.initialBranch)
  })

  ipcMain.handle('git:configGet', async (_, p: IpcContract['git:configGet']['request']) => {
    const args = ['config']
    if (p.scope === 'global') args.push('--global')
    args.push('--get', p.key)
    const r = await gitRun(p.path || process.cwd(), args)
    return { value: r.ok ? r.stdout.trim() : null }
  })
  ipcMain.handle('git:configSet', async (_, p: IpcContract['git:configSet']['request']) => {
    const args = ['config']
    if (p.scope === 'global') args.push('--global')
    args.push(p.key, p.value)
    const r = await gitRun(p.path || process.cwd(), args)
    return r.ok ? { ok: true } : { ok: false, error: r.stderr || r.stdout }
  })
}
