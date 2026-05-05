export interface CommitInfo {
  hash: string
  short: string
  message: string
  date: string
  author: string
}

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  status: 'added' | 'modified' | 'deleted' | 'renamed'
}
