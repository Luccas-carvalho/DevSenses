import type { DiffFile } from '@shared/git'

/**
 * Parses unified git diff text into a list of DiffFile entries.
 * Used to rehydrate the file list when viewing a saved analysis.
 */
export function parseDiffFiles(diff: string): DiffFile[] {
  if (!diff) return []
  const out: DiffFile[] = []
  const lines = diff.split('\n')

  let current: DiffFile | null = null
  let sawNewFile = false
  let sawDeleted = false
  let sawRename = false

  const push = (): void => {
    if (!current) return
    let status: DiffFile['status'] = 'modified'
    if (sawNewFile) status = 'added'
    else if (sawDeleted) status = 'deleted'
    else if (sawRename) status = 'renamed'
    out.push({ ...current, status })
  }

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      push()
      sawNewFile = false
      sawDeleted = false
      sawRename = false
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/)
      const path = match ? match[2] : ''
      current = { path, additions: 0, deletions: 0, status: 'modified' }
      continue
    }
    if (!current) continue
    if (line.startsWith('new file mode')) sawNewFile = true
    else if (line.startsWith('deleted file mode')) sawDeleted = true
    else if (line.startsWith('rename from ') || line.startsWith('rename to ')) sawRename = true
    else if (line.startsWith('+++ ')) {
      // skip header
    } else if (line.startsWith('--- ')) {
      // skip header
    } else if (line.startsWith('+') && !line.startsWith('+++')) current.additions++
    else if (line.startsWith('-') && !line.startsWith('---')) current.deletions++
  }

  push()
  return out.filter((f) => f.path)
}

/**
 * Extracts the diff section for a single file from a unified git diff.
 * Returns empty string if file not found.
 */
export function extractFileDiff(diff: string, filePath: string): string {
  if (!diff || !filePath) return ''
  const lines = diff.split('\n')
  let capturing = false
  const collected: string[] = []
  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/)
      const path = match ? match[2] : ''
      if (capturing) break
      if (path === filePath) {
        capturing = true
        collected.push(line)
      }
      continue
    }
    if (capturing) collected.push(line)
  }
  return collected.join('\n')
}
