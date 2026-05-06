export interface CommitInfo {
  hash: string
  short: string
  message: string
  date: string
  author: string
}

export interface CommitInfoExtended extends CommitInfo {
  email: string
  refs: string[]
}

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  status: 'added' | 'modified' | 'deleted' | 'renamed'
}

export type StatusKind =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'ignored'
  | 'conflicted'

export interface FileStatus {
  path: string
  oldPath?: string
  staged: StatusKind | null
  unstaged: StatusKind | null
}

export interface RepoStatus {
  branch: string
  upstream: string | null
  ahead: number
  behind: number
  isMerging: boolean
  isRebasing: boolean
  files: FileStatus[]
}

export interface StashEntry {
  index: number
  branch: string
  message: string
  date: string
}

export interface DetectedEditor {
  id: 'vscode' | 'cursor' | 'sublime' | 'webstorm' | 'intellij' | 'zed' | 'fleet' | 'xcode'
  label: string
  bin: string
}

export interface DetectedTerminal {
  id: 'terminal' | 'iterm' | 'warp' | 'ghostty'
  label: string
}
