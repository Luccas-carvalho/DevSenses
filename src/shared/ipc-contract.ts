import type { ProviderId, ProviderStatus, ModelOption } from './providers'
import type { SettingsKey, SettingsValueMap } from './settings'
import type { CodeReview } from './codeReview'
import type {
  CommitInfo,
  CommitInfoExtended,
  DiffFile,
  RepoStatus,
  StashEntry,
  DetectedEditor,
  DetectedTerminal,
  BranchDetailed
} from './git'

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string | null
  notes: string | null
  /** URL de download do instalador do SO atual (ou a página da release como fallback). */
  url: string | null
  /** Página HTML da release (pra "ver notas"). */
  htmlUrl: string | null
  publishedAt: string | null
}

export interface IpcContract {
  'settings:get': {
    request: { key: SettingsKey }
    response: SettingsValueMap[SettingsKey] | null
  }
  'settings:set': {
    request: { key: SettingsKey; value: SettingsValueMap[SettingsKey] }
    response: void
  }
  'settings:all': {
    request: void
    response: Partial<SettingsValueMap>
  }

  'providers:detect': {
    request: void
    response: Record<ProviderId, ProviderStatus>
  }
  'providers:listModels': {
    request: void
    response: Record<ProviderId, ModelOption[]>
  }
  'providers:test': {
    request: { id: ProviderId }
    response: { ok: boolean; latencyMs: number; error: string | null }
  }
  'providers:invoke': {
    request: { id: ProviderId; prompt: string; streamId: string }
    response: void
  }
  'providers:abort': {
    request: { streamId: string }
    response: void
  }

  'workspace:pickFolder': {
    request: void
    response: { path: string; name: string } | null
  }
  'workspace:recent': {
    request: void
    response: Array<{ path: string; name: string; lastOpenedAt: number; favorite: boolean }>
  }
  'workspace:setFavorite': {
    request: { path: string; favorite: boolean }
    response: { ok: boolean }
  }

  'workspace:openProject': {
    request: { path: string; mode?: 'all' | 'uncommitted' | 'committed' }
    response: {
      valid: boolean
      branch: string
      baseBranch: string
      mergeBase: string
      commits: CommitInfo[]
      diff: string
      files: DiffFile[]
    }
  }
  'workspace:getDiff': {
    request: { path: string; fromHash?: string; toHash?: string }
    response: { diff: string }
  }
  'workspace:getCommits': {
    request: { path: string; limit?: number }
    response: CommitInfo[]
  }
  'workspace:getDiffForFile': {
    request: {
      path: string
      filePath: string
      fromHash?: string
      toHash?: string
      mode?: 'all' | 'uncommitted' | 'committed'
    }
    response: { diff: string }
  }
  'workspace:getDiffFiles': {
    request: { path: string; fromHash?: string; toHash?: string }
    response: DiffFile[]
  }
  'workspace:watch': {
    request: { path: string }
    response: void
  }
  'workspace:unwatch': {
    request: void
    response: void
  }
  'workspace:getBranches': {
    request: { path: string }
    response: string[]
  }
  'git:branchesDetailed': {
    request: { path: string }
    response: BranchDetailed[]
  }
  'git:recentCheckouts': {
    request: { path: string; limit?: number }
    response: string[]
  }
  'workspace:checkoutBranch': {
    request: { path: string; branch: string }
    response: { ok: boolean; error?: string }
  }

  'git:status': {
    request: { path: string }
    response: RepoStatus
  }
  'git:stageFiles': {
    request: { path: string; files: string[] }
    response: { ok: boolean; error?: string }
  }
  'git:unstageFiles': {
    request: { path: string; files: string[] }
    response: { ok: boolean; error?: string }
  }
  'git:commit': {
    request: { path: string; summary: string; description?: string; amend?: boolean }
    response: { ok: boolean; hash?: string; error?: string }
  }
  'git:undoLastCommit': {
    request: { path: string }
    response: { ok: boolean; error?: string }
  }
  'git:lastCommit': {
    request: { path: string }
    response: { hash: string; subject: string; body: string } | null
  }
  'git:push': {
    request: { path: string; force?: boolean; setUpstream?: boolean }
    response: { ok: boolean; output?: string; error?: string }
  }
  'git:pull': {
    request: { path: string; rebase?: boolean }
    response: { ok: boolean; output?: string; error?: string }
  }
  'git:fetch': {
    request: { path: string; prune?: boolean }
    response: { ok: boolean; output?: string; error?: string }
  }
  'git:aheadBehind': {
    request: { path: string }
    response: { ahead: number; behind: number; upstream: string | null }
  }
  'git:createBranch': {
    request: { path: string; name: string; baseRef?: string; checkout?: boolean }
    response: { ok: boolean; error?: string }
  }
  'git:deleteBranch': {
    request: { path: string; name: string; force?: boolean; remote?: boolean }
    response: { ok: boolean; error?: string }
  }
  'git:renameBranch': {
    request: { path: string; oldName: string; newName: string }
    response: { ok: boolean; error?: string }
  }
  'git:mergeBranch': {
    request: { path: string; from: string; strategy?: 'merge' | 'squash' | 'rebase' }
    response: { ok: boolean; output?: string; error?: string }
  }
  'git:abortMerge': {
    request: { path: string }
    response: { ok: boolean; error?: string }
  }
  'git:abortRebase': {
    request: { path: string }
    response: { ok: boolean; error?: string }
  }
  'git:continueMerge': {
    request: { path: string; message?: string }
    response: { ok: boolean; error?: string }
  }
  'git:discardAll': {
    request: { path: string; includeUntracked?: boolean }
    response: { ok: boolean; error?: string }
  }
  'git:discardFile': {
    request: { path: string; file: string }
    response: { ok: boolean; error?: string }
  }
  'git:appendGitignore': {
    request: { path: string; patterns: string[] }
    response: { ok: boolean; error?: string }
  }
  'git:stash': {
    request: { path: string; message?: string; includeUntracked?: boolean }
    response: { ok: boolean; error?: string }
  }
  'git:stashList': {
    request: { path: string }
    response: StashEntry[]
  }
  'git:stashPop': {
    request: { path: string; index: number }
    response: { ok: boolean; error?: string }
  }
  'git:stashApply': {
    request: { path: string; index: number }
    response: { ok: boolean; error?: string }
  }
  'git:stashDrop': {
    request: { path: string; index: number }
    response: { ok: boolean; error?: string }
  }
  'git:logExtended': {
    request: { path: string; limit?: number; skip?: number; branch?: string }
    response: CommitInfoExtended[]
  }
  'git:diffForCommit': {
    request: { path: string; hash: string }
    response: { diff: string; files: DiffFile[] }
  }
  'git:remoteUrl': {
    request: { path: string; remote?: string }
    response: {
      url: string | null
      webUrl: string | null
      owner: string | null
      repo: string | null
      host: string | null
    }
  }
  'git:prPreview': {
    request: { path: string; base: string; head: string }
    response: {
      commitCount: number
      additions: number
      deletions: number
      files: DiffFile[]
      commits: CommitInfo[]
    }
  }
  'git:diffRange': {
    request: { path: string; base: string; head: string; file?: string }
    response: { diff: string }
  }
  'git:canMerge': {
    request: { path: string; base: string; head: string }
    response: { canMerge: boolean; reason: string | null }
  }
  'git:clone': {
    request: { url: string; dest: string }
    response: { ok: boolean; path?: string; error?: string }
  }
  'git:init': {
    request: { dest: string; initialBranch?: string }
    response: { ok: boolean; path?: string; error?: string }
  }
  'git:configGet': {
    request: { path: string; key: string; scope?: 'local' | 'global' }
    response: { value: string | null }
  }
  'git:configSet': {
    request: { path: string; key: string; value: string; scope?: 'local' | 'global' }
    response: { ok: boolean; error?: string }
  }

  'editors:detect': {
    request: void
    response: DetectedEditor[]
  }
  'terminals:detect': {
    request: void
    response: DetectedTerminal[]
  }
  'repository:openInEditor': {
    request: { path: string; file?: string; line?: number; editorId?: string }
    response: { ok: boolean; error?: string }
  }
  'repository:openInTerminal': {
    request: { path: string; terminalId?: string }
    response: { ok: boolean; error?: string }
  }
  'repository:openInFinder': {
    request: { path: string; file?: string }
    response: { ok: boolean; error?: string }
  }
  'repository:openFile': {
    request: { path: string; file: string }
    response: { ok: boolean; error?: string }
  }
  'repository:openUrl': {
    request: { url: string }
    response: { ok: boolean; error?: string }
  }
  'repository:pickFolder': {
    request: { title?: string; mustBeEmpty?: boolean }
    response: { path: string } | null
  }
  'repository:fileBlob': {
    request: { path: string; file: string; ref?: string }
    response: {
      exists: boolean
      base64: string | null
      size: number
      mime: string | null
    }
  }

  'telemetry:track': {
    request: { event: string; payload?: Record<string, unknown> }
    response: void
  }
  'telemetry:summary': {
    request: void
    response: {
      total: number
      enabled: boolean
      byEvent: Array<{ event: string; count: number; lastSeen: number }>
    }
  }
  'telemetry:clear': {
    request: void
    response: void
  }

  'app:getVersion': {
    request: void
    response: { version: string; name: string }
  }
  'app:checkForUpdates': {
    request: void
    response: { ok: boolean; error?: string }
  }
  /** Check de atualização via GitHub Releases (compara versão; devolve o instalador do SO). */
  'update:check': {
    request: void
    response: UpdateInfo
  }
  /** Baixa o instalador DENTRO do app (progresso via evento `update:downloadProgress`) e abre no fim. */
  'update:download': {
    request: { url: string }
    response: { ok: boolean }
  }
  /** Reinicia aplicando a atualização já baixada pelo electron-updater (Win/Linux). */
  'update:quitAndInstall': {
    request: void
    response: { ok: true }
  }
  'app:openExternal': {
    request: { url: string }
    response: { ok: boolean; error?: string }
  }

  'menu:setState': {
    request: {
      hasProject: boolean
      branchName: string | null
      onBranch: boolean
      onDetachedHead: boolean
      branchIsUnborn: boolean
      onNonDefaultBranch: boolean
      hasPublishedBranch: boolean
      hasRemote: boolean
      isHostedOnGitHub: boolean
      hasChangedFiles: boolean
      hasStaged: boolean
      hasMultipleBranches: boolean
      hasConflicts: boolean
      rebaseInProgress: boolean
      isMerging: boolean
      networkInProgress: boolean
      branchHasStash: boolean
      hasContributionTargetDefaultBranch: boolean
      onContributionTargetDefaultBranch: boolean
      isAhead: boolean
      isBehind: boolean
    }
    response: void
  }

  'concepts:upsert': {
    request: {
      name: string
      category?: string
      language?: string
      framework?: string
      note?: string
    }
    response: { id: number; firstTime: boolean }
  }
  'concepts:list': {
    request: void
    response: Array<{
      id: number
      name: string
      category: string
      language: string | null
      framework: string | null
      firstSeenAt: number
      timesSeen: number
      markedLearned: boolean
      lastNote: string | null
    }>
  }
  'concepts:setLearned': {
    request: { id: number; learned: boolean }
    response: void
  }
  'concepts:setNote': {
    request: { id: number; note: string | null }
    response: void
  }
  'concepts:explainTerm': {
    request: { term: string; contextSnippet?: string; regenerate?: boolean }
    response: { definition: string; example: string }
  }
  'concepts:masteryBatch': {
    request: { names: string[] }
    response: Record<string, { level: number; correct: number; wrong: number } | null>
  }
  'concepts:seenSince': {
    request: { since: number }
    response: Array<{
      name: string
      firstSeenAt: number
      timesSeen: number
      masteryLevel: number
    }>
  }
  'ai:cheatSheet': {
    request: { selection: string; language?: string }
    response: string
  }
  'ai:whatIf': {
    request: { diff: string; alternative: string }
    response: string
  }
  'ai:bugHunt': {
    request: { snippet: string; language?: string }
    response: {
      buggyCode: string
      language: string
      hint: string
      bugLine?: number
      explanation: string
      fixedCode: string
    }
  }

  'ai:codeReview': {
    request: { diff: string }
    response: CodeReview
  }

  'analyses:updateReview': {
    request: { id: number; review: CodeReview }
    response: void
  }

  'analyses:save': {
    request: {
      projectPath: string
      projectName: string
      branch: string
      diffMode: string
      filesCount: number
      additions: number
      deletions: number
      diff: string
      analysis: string
      providerId: string
      seniority: string
      professorTurbo: boolean
      title?: string
    }
    response: number
  }
  'analyses:list': {
    request: { path: string; branch?: string }
    response: Array<{
      id: number
      projectPath: string
      projectName: string
      branch: string
      diffMode: string
      filesCount: number
      additions: number
      deletions: number
      providerId: string
      title: string | null
      createdAt: number
    }>
  }
  'analyses:get': {
    request: { id: number }
    response: {
      id: number
      projectPath: string
      projectName: string
      branch: string
      diffMode: string
      filesCount: number
      additions: number
      deletions: number
      diff: string
      analysis: string
      providerId: string
      seniority: string
      professorTurbo: boolean
      title: string | null
      createdAt: number
      review: CodeReview | null
    } | null
  }
  'analyses:delete': {
    request: { id: number }
    response: void
  }
  'analyses:clearProject': {
    request: { path: string }
    response: void
  }

  'quiz:generate': {
    request: { analysisId: number; regenerate?: boolean }
    response: Array<{
      id: number
      analysisId: number
      question: string
      options: string[]
      correctIdx: number
      explainCorrect: string
      explainWrong: string
      userAnswerIdx: number | null
      answeredAt: number | null
      createdAt: number
    }>
  }
  'quiz:answer': {
    request: { id: number; idx: number }
    response: {
      id: number
      analysisId: number
      question: string
      options: string[]
      correctIdx: number
      explainCorrect: string
      explainWrong: string
      userAnswerIdx: number | null
      answeredAt: number | null
      createdAt: number
    } | null
  }
  'quiz:byAnalysis': {
    request: { analysisId: number }
    response: Array<{
      id: number
      analysisId: number
      question: string
      options: string[]
      correctIdx: number
      explainCorrect: string
      explainWrong: string
      userAnswerIdx: number | null
      answeredAt: number | null
      createdAt: number
    }>
  }

  'tests:detectUrl': {
    request: { path: string }
    response: { suggested: string | null; scripts: Record<string, string> }
  }
  'tests:run': {
    request: {
      baseUrl: string
      actions: Array<Record<string, unknown>>
      prompt?: string
      intensity?: 'sane' | 'chaos' | 'nuclear'
      recordVideo?: boolean
    }
    response: {
      id: string
      ok: boolean
      baseUrl: string
      prompt: string | null
      intensity: 'sane' | 'chaos' | 'nuclear'
      actionsCount: number
      startedAt: number
      finishedAt: number
      log: Array<{
        index: number
        action: string
        ok: boolean
        detail?: string
        error?: string
        ts: number
      }>
      screenshots: string[]
      videoPath: string | null
      error: string | null
      folder: string
    }
  }
  'tests:listRuns': {
    request: void
    response: Array<{
      id: string
      ok: boolean
      baseUrl: string
      prompt: string | null
      intensity: string
      actionsCount: number
      startedAt: number
      finishedAt: number
      screenshotCount: number
      hasVideo: boolean
      folder: string
      error: string | null
    }>
  }
  'tests:loadRun': {
    request: { id: string }
    response: {
      id: string
      ok: boolean
      baseUrl: string
      prompt: string | null
      intensity: string
      actionsCount: number
      startedAt: number
      finishedAt: number
      log: Array<{
        index: number
        action: string
        ok: boolean
        detail?: string
        error?: string
        ts: number
      }>
      screenshots: string[]
      videoPath: string | null
      error: string | null
      folder: string
    }
  }
  'tests:openFolder': {
    request: { path: string }
    response: string
  }
  'tests:deleteRun': {
    request: { id: string }
    response: void
  }
  'tests:readImage': {
    request: { path: string }
    response: string
  }
  'tests:readVideo': {
    request: { path: string }
    response: string
  }
  'tests:cancelAgent': {
    request: void
    response: void
  }
  'tests:agentRun': {
    request: {
      baseUrl: string
      goal: string
      intensity: 'sane' | 'chaos' | 'nuclear'
      providerId: string
      maxSteps?: number
      runId?: string
    }
    response: {
      id: string
      ok: boolean
      baseUrl: string
      prompt: string | null
      intensity: 'sane' | 'chaos' | 'nuclear'
      actionsCount: number
      startedAt: number
      finishedAt: number
      log: Array<{
        index: number
        action: string
        ok: boolean
        detail?: string
        error?: string
        ts: number
      }>
      screenshots: string[]
      videoPath: string | null
      error: string | null
      folder: string
    }
  }
}

export interface IpcEvents {
  'providers:stream': { streamId: string; chunk: string; done: boolean; error: string | null }
  'workspace:changed': { path: string }
  'app:open-project': { path: string }
  'menu:action': { action: string }
  'updater:event':
    | { type: 'checking' }
    | { type: 'available'; version: string }
    | { type: 'not-available' }
    | { type: 'progress'; percent: number }
    | { type: 'downloaded'; version: string }
    | { type: 'error'; message: string }
  /** Progresso do download in-app do instalador (modal de update). */
  'update:downloadProgress': { percent: number; done: boolean; failed: boolean }
  'tests:agentEvent':
    | {
        runId: string
        type: 'snapshot'
        step: number
        url: string
        title: string
        elementsCount: number
      }
    | { runId: string; type: 'thinking'; step: number }
    | {
        runId: string
        type: 'action'
        step: number
        action: string
        detail?: string
        ok: boolean
        error?: string
      }
    | { runId: string; type: 'done'; reason: string }
    | { runId: string; type: 'fail'; reason: string }
    | { runId: string; type: 'frame'; data: string }
}

export type IpcChannel = keyof IpcContract
export type IpcRequest<C extends IpcChannel> = IpcContract[C]['request']
export type IpcResponse<C extends IpcChannel> = IpcContract[C]['response']
