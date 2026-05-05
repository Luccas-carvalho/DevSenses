import type { ProviderId, ProviderStatus } from './providers'
import type { SettingsKey, SettingsValueMap } from './settings'
import type { CommitInfo, DiffFile } from './git'

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
    response: Array<{ path: string; name: string; lastOpenedAt: number }>
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
  'workspace:checkoutBranch': {
    request: { path: string; branch: string }
    response: { ok: boolean; error?: string }
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
}

export interface IpcEvents {
  'providers:stream': { streamId: string; chunk: string; done: boolean; error: string | null }
  'workspace:changed': { path: string }
  'app:open-project': { path: string }
}

export type IpcChannel = keyof IpcContract
export type IpcRequest<C extends IpcChannel> = IpcContract[C]['request']
export type IpcResponse<C extends IpcChannel> = IpcContract[C]['response']
