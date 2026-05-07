import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  GitBranch,
  Zap,
  RefreshCw,
  Loader2,
  AlertTriangle,
  FileCode,
  Plus,
  Minus,
  Sparkles,
  ChevronUp,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Settings as SettingsIcon,
  GitCommit,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderPlus,
  History,
  X,
  Trash2,
  FlaskConical,
  Terminal,
  ExternalLink,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import { buildDiffPrompt } from '@/lib/diffPrompt'
import type { DiffFile } from '@shared/git'
import type { SeniorityLevel } from '@shared/seniority'
import type { ThemeMode, DiffMode } from '@shared/settings'
import { cn } from '@/lib/utils'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { PROVIDER_MODELS, PROVIDER_LABELS } from '@/lib/providerModels'
import { Highlight, type PrismTheme } from 'prism-react-renderer'
import AskAIInline from '@/components/AskAIInline'
import { useCodeTheme } from '@/hooks/useCodeTheme'
import SyncButton from '@/components/git/SyncButton'
import DiffSearchBar from '@/components/git/DiffSearchBar'
import NewBranchDialog from '@/components/git/dialogs/NewBranchDialog'
import ConfirmDialog from '@/components/git/dialogs/ConfirmDialog'
import MergeIntoDialog from '@/components/git/dialogs/MergeIntoDialog'
import RenameBranchDialog from '@/components/git/dialogs/RenameBranchDialog'
import DeleteBranchDialog from '@/components/git/dialogs/DeleteBranchDialog'
import OpenPullRequestDialog from '@/components/git/dialogs/OpenPullRequestDialog'
import CloneDialog from '@/components/git/dialogs/CloneDialog'
import CommitDialog from '@/components/git/dialogs/CommitDialog'
import CommitArea from '@/components/git/CommitArea'
import { track } from '@/lib/telemetry'
import DiffModeDropdown from '@/components/git/DiffModeDropdown'
import BranchSwitcher from '@/components/git/BranchSwitcher'
import HistoryTab from '@/components/git/HistoryTab'
import ConflictResolver from '@/components/git/ConflictResolver'
import MediaPreview, { getMediaKind } from '@/components/git/MediaPreview'
import { prefetchBlob, trimCache, clearCacheFor } from '@/lib/mediaCache'
import Tooltip from '@/components/ui/Tooltip'
import Logo from '@/components/Logo'
import type { RepoStatus } from '@shared/git'

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', mjs: 'javascript', cjs: 'javascript',
  json: 'json', md: 'markdown', mdx: 'markdown', css: 'css', scss: 'scss', less: 'css',
  html: 'markup', htm: 'markup', xml: 'markup', svg: 'markup', vue: 'markup',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin',
  php: 'php', cs: 'csharp', cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp', swift: 'swift',
  yml: 'yaml', yaml: 'yaml', toml: 'toml', sh: 'bash', bash: 'bash', zsh: 'bash',
  sql: 'sql', graphql: 'graphql', gql: 'graphql', dockerfile: 'docker'
}

function detectLanguage(file: string): string {
  const ext = file.split('.').pop()?.toLowerCase() ?? ''
  if (file.toLowerCase().includes('dockerfile')) return 'docker'
  return EXT_TO_LANG[ext] ?? 'tsx'
}

function HighlightedCode({
  code,
  language,
  prismTheme
}: {
  code: string
  language: string
  prismTheme: PrismTheme
}): React.ReactElement {
  return (
    <Highlight code={code} language={language} theme={prismTheme}>
      {({ tokens, getTokenProps }) => (
        <>
          {tokens[0]?.map((token, i) => (
            <span key={i} {...getTokenProps({ token })} />
          ))}
        </>
      )}
    </Highlight>
  )
}

type AnalysisState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

type ParsedSection =
  | { kind: 'fileHeader'; path: string; status?: 'new' | 'deleted' | 'renamed' }
  | { kind: 'hunkBreak' }
  | {
      kind: 'line'
      type: 'add' | 'del' | 'ctx'
      content: string
      newNum: number | null
      file: string
    }

export interface LineComment {
  file: string
  line: number
  title: string
  why?: string
  before?: string
  after?: string
  concepts?: { code?: string; text: string }[]
}

function basename(p: string): string {
  return p.split('/').pop() ?? p
}

function parseLineComments(text: string): LineComment[] {
  const comments: LineComment[] = []
  // Split by `### Linha N (file)` header. Capture content until next header or `---`
  const headerRe = /^###\s+Linha\s+(\d+)\s*\(([^)]+)\)\s*:?\s*(.*)$/gm
  const matches: { idx: number; line: number; file: string; title: string }[] = []
  let m: RegExpExecArray | null
  while ((m = headerRe.exec(text)) !== null) {
    matches.push({
      idx: m.index,
      line: parseInt(m[1], 10),
      file: basename(m[2].trim()),
      title: m[3].trim()
    })
  }
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].idx
    const end = i + 1 < matches.length ? matches[i + 1].idx : text.length
    const body = text.slice(start, end)
    comments.push({
      file: matches[i].file,
      line: matches[i].line,
      title: matches[i].title,
      ...extractFields(body)
    })
  }
  return comments
}

function extractFields(body: string): {
  why?: string
  before?: string
  after?: string
  concepts?: { code?: string; text: string }[]
} {
  const result: { why?: string; before?: string; after?: string; concepts?: { code?: string; text: string }[] } = {}

  const beforeMatch = body.match(/\*\*Antes:\*\*\s*\n```[\w-]*\n([\s\S]*?)\n```/)
  if (beforeMatch) result.before = beforeMatch[1]

  const afterMatch = body.match(/\*\*Depois:\*\*\s*\n```[\w-]*\n([\s\S]*?)\n```/)
  if (afterMatch) result.after = afterMatch[1]

  const whyMatch = body.match(/\*\*Por que:\*\*\s*([\s\S]*?)(?=\n\*\*|\n---|\n###|$)/)
  if (whyMatch) result.why = whyMatch[1].trim()

  const conceptsMatch = body.match(/\*\*Conceitos:\*\*[^\n]*\n([\s\S]*?)(?=\n---|\n###|$)/)
  if (conceptsMatch) {
    const lines = conceptsMatch[1].split('\n').filter((l) => /^\s*[-*]\s+/.test(l))
    const concepts = lines
      .map((l) => {
        const stripped = l.replace(/^\s*[-*]\s+/, '')
        const inlineCode = stripped.match(/^`([^`]+)`\s*:\s*(.+)$/)
        if (inlineCode) return { code: inlineCode[1], text: inlineCode[2].trim() }
        return { text: stripped.trim() }
      })
      .filter((c) => c.text.length > 0)
    if (concepts.length > 0) result.concepts = concepts
  }
  return result
}

function parseDiff(raw: string): ParsedSection[] {
  const result: ParsedSection[] = []
  let cur = 0
  let pendingFileHeader: ParsedSection | null = null
  let inHeader = false
  let currentFile = ''

  for (const line of raw.split('\n')) {
    if (line.startsWith('diff --git')) {
      // Flush previous header if any (no content followed it — still want it shown)
      if (pendingFileHeader) result.push(pendingFileHeader)
      const m = line.match(/^diff --git a\/(.+?) b\/(.+)$/)
      const path = m ? m[2] : ''
      currentFile = path
      pendingFileHeader = { kind: 'fileHeader', path }
      inHeader = true
      continue
    }
    if (inHeader) {
      if (line.startsWith('new file')) {
        if (pendingFileHeader && pendingFileHeader.kind === 'fileHeader')
          pendingFileHeader.status = 'new'
        continue
      }
      if (line.startsWith('deleted file')) {
        if (pendingFileHeader && pendingFileHeader.kind === 'fileHeader')
          pendingFileHeader.status = 'deleted'
        continue
      }
      if (line.startsWith('rename ')) {
        if (pendingFileHeader && pendingFileHeader.kind === 'fileHeader')
          pendingFileHeader.status = 'renamed'
        continue
      }
      if (
        line.startsWith('index ') ||
        line.startsWith('--- ') ||
        line.startsWith('+++ ') ||
        line.startsWith('similarity ') ||
        line.startsWith('mode ') ||
        line.startsWith('old mode') ||
        line.startsWith('new mode')
      ) {
        continue
      }
      // Reached real content — flush file header and switch out of header mode
      if (pendingFileHeader) {
        result.push(pendingFileHeader)
        pendingFileHeader = null
      }
      inHeader = false
    }

    if (line.startsWith('@@')) {
      const m = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (m) cur = parseInt(m[1], 10)
      result.push({ kind: 'hunkBreak' })
      continue
    }
    if (line.startsWith('\\')) continue
    if (line.startsWith('+')) {
      result.push({
        kind: 'line',
        type: 'add',
        content: line.slice(1),
        newNum: cur++,
        file: currentFile
      })
    } else if (line.startsWith('-')) {
      result.push({
        kind: 'line',
        type: 'del',
        content: line.slice(1),
        newNum: null,
        file: currentFile
      })
    } else {
      result.push({
        kind: 'line',
        type: 'ctx',
        content: line.length > 0 ? line.slice(1) : '',
        newNum: cur++,
        file: currentFile
      })
    }
  }
  if (pendingFileHeader) result.push(pendingFileHeader)
  return result
}

function splitPath(filePath: string): { name: string; dir: string } {
  const parts = filePath.split('/')
  const name = parts.pop() ?? filePath
  const dir = parts.length > 0 ? parts.join('/') + '/' : ''
  return { name, dir }
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="bg-muted px-1 rounded text-[11px] font-mono text-primary/80">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export default function Project() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const path = params.get('path') ?? ''
  const repoName = path.split('/').pop() ?? 'projeto'

  const { value: seniority, loading: seniorityLoading } = useSettings('seniority')
  const { value: providerDefault, loading: providerLoading } = useSettings('provider_default')
  const { value: providerModel } = useSettings('provider_model')
  const { value: professorTurboSaved } = useSettings('professor_turbo')
  const { value: diffModeSaved } = useSettings('diff_mode')

  const settingsReady = !seniorityLoading && !providerLoading && !!seniority && !!providerDefault

  const [branch, setBranch] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [checkingOut, setCheckingOut] = useState(false)
  const [files, setFiles] = useState<DiffFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [diff, setDiff] = useState('')
  const [fullDiff, setFullDiff] = useState('')
  const [diffLoading, setDiffLoading] = useState(true)
  const [diffSwitching, setDiffSwitching] = useState(false)
  const [diffMode, setDiffMode] = useState<DiffMode>('all')

  // Sync diff mode from settings
  useEffect(() => {
    if (diffModeSaved) setDiffMode(diffModeSaved as DiffMode)
  }, [diffModeSaved])

  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
  const [analysisText, setAnalysisText] = useState('')
  const [professorTurbo, setProfessorTurbo] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [viewingAnalysisId, setViewingAnalysisId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState(0)
  const [diffMatches, setDiffMatches] = useState<Array<{ lineIdx: number }>>([])
  const [newBranchOpen, setNewBranchOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState<{ strategy: 'merge' | 'squash' | 'rebase' } | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [discardBusy, setDiscardBusy] = useState(false)
  const [discardError, setDiscardError] = useState('')
  const [prDialogOpen, setPrDialogOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'changes' | 'history'>('changes')
  const [viewingCommitHash, setViewingCommitHash] = useState<string | null>(null)
  const [cloneOpen, setCloneOpen] = useState(false)
  const [commitDialogOpen, setCommitDialogOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [repoMenuOpen, setRepoMenuOpen] = useState(false)
  const [repoMenuPos, setRepoMenuPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const repoMenuButtonRef = useRef<HTMLButtonElement>(null)
  const repoMenuPopupRef = useRef<HTMLDivElement>(null)
  const [remoteWebUrl, setRemoteWebUrl] = useState<string | null>(null)

  const lineComments = useMemo(() => parseLineComments(analysisText), [analysisText])

  // Persist concepts + save analysis to history when analysis finishes
  const persistedAnalysisRef = useRef<string>('')
  const [historyVersion, setHistoryVersion] = useState(0)
  useEffect(() => {
    if (analysisState !== 'done') return
    if (viewingAnalysisId !== null) return // viewing past analysis — never re-save
    if (persistedAnalysisRef.current === analysisText) return
    persistedAnalysisRef.current = analysisText

    const seen = new Set<string>()
    for (const c of lineComments) {
      for (const concept of c.concepts ?? []) {
        const name = concept.code ?? concept.text.slice(0, 60)
        if (!name || seen.has(name)) continue
        seen.add(name)
        window.api
          .invoke('concepts:upsert', { name, note: concept.text })
          .catch(() => undefined)
      }
    }

    // save analysis to history
    if (analysisText && fullDiff && providerDefault && seniority) {
      const additions = files.reduce((s, f) => s + f.additions, 0)
      const deletions = files.reduce((s, f) => s + f.deletions, 0)
      const summaryMatch = analysisText.match(/##\s+Resumo\s*\n([^\n]+)/i)
      const title = summaryMatch
        ? summaryMatch[1].trim().slice(0, 120)
        : `${files.length} arquivo${files.length !== 1 ? 's' : ''} · ${branch}`
      console.log('[analyses:save] persisting', {
        path,
        branch: branch || 'HEAD',
        files: files.length
      })
      window.api
        .invoke('analyses:save', {
          projectPath: path,
          projectName: repoName,
          branch: branch || 'HEAD',
          diffMode,
          filesCount: files.length,
          additions,
          deletions,
          diff: fullDiff,
          analysis: analysisText,
          providerId: providerDefault as string,
          seniority: seniority as string,
          professorTurbo,
          title
        })
        .then((id) => {
          console.log('[analyses:save] saved id=', id)
          setHistoryVersion((v) => v + 1)
        })
        .catch((err) => {
          console.error('[analyses:save] failed', err)
        })
    } else {
      console.warn('[analyses:save] skipped — missing fields', {
        hasText: !!analysisText,
        hasDiff: !!fullDiff,
        hasProvider: !!providerDefault,
        hasSeniority: !!seniority
      })
    }
  }, [
    analysisState,
    analysisText,
    lineComments,
    fullDiff,
    files,
    branch,
    diffMode,
    path,
    repoName,
    providerDefault,
    seniority,
    professorTurbo,
    viewingAnalysisId
  ])

  const streamIdRef = useRef<string | null>(null)
  const analysisRef = useRef<HTMLDivElement>(null)
  const selectedFileRef = useRef<string | null>(null)
  const fetchInFlightRef = useRef(false)
  const fetchPendingRef = useRef(false)
  selectedFileRef.current = selectedFile

  useEffect(() => {
    if (!path || files.length === 0) return
    const mediaFiles = files.filter((f) => getMediaKind(f.path)).slice(0, 30)
    if (mediaFiles.length === 0) return
    const handle = window.setTimeout(() => {
      for (const f of mediaFiles) {
        if (f.status !== 'added') prefetchBlob(path, f.path, 'HEAD')
        if (f.status !== 'deleted') prefetchBlob(path, f.path, null)
      }
      trimCache()
    }, 50)
    return () => window.clearTimeout(handle)
  }, [files, path])

  const runAnalysis = useCallback(
    async (diffText: string) => {
      if (!providerDefault || !seniority || !diffText) return
      track('ai_analyze_clicked', { provider: providerDefault, seniority, turbo: professorTurbo })
      if (streamIdRef.current) {
        await window.api.invoke('providers:abort', { streamId: streamIdRef.current })
      }
      const streamId = `diff-${Date.now()}`
      streamIdRef.current = streamId
      setAnalysisText('')
      setAnalysisState('loading')
      setError('')
      const prompt = buildDiffPrompt(diffText, seniority as SeniorityLevel, professorTurbo)
      await window.api.invoke('providers:invoke', {
        id: providerDefault as 'claude' | 'codex' | 'gemini' | 'aider' | 'ollama',
        prompt,
        streamId
      })
    },
    [providerDefault, seniority, professorTurbo]
  )

  const diffModeRef = useRef(diffMode)
  diffModeRef.current = diffMode

  const fetchProject = useCallback(
    async (initial = false): Promise<string | null> => {
      if (!path) return null
      if (fetchInFlightRef.current) {
        fetchPendingRef.current = true
        return null
      }
      fetchInFlightRef.current = true
      try {
        if (initial) setDiffLoading(true)
        const mode = diffModeRef.current
        const result = await window.api.invoke('workspace:openProject', { path, mode })
        if (initial) setDiffLoading(false)
        if (!result.valid) {
          setError('Pasta não é um repositório git válido.')
          return null
        }
        setBranch(result.branch)
        // Load branches list in background (not critical for first paint)
        window.api
          .invoke('workspace:getBranches', { path })
          .then(setBranches)
          .catch(() => setBranches([]))
        setFiles(result.files ?? [])
        setFullDiff(result.diff)
        const sel = selectedFileRef.current
        const stillExists = sel ? result.files?.some((f) => f.path === sel) : false
        if (sel && stillExists) {
          const fr = await window.api.invoke('workspace:getDiffForFile', {
            path,
            filePath: sel,
            mode
          })
          setDiff(fr.diff)
        } else {
          if (sel && !stillExists) setSelectedFile(null)
          setDiff(result.diff)
        }
        return result.diff
      } finally {
        fetchInFlightRef.current = false
        if (fetchPendingRef.current) {
          fetchPendingRef.current = false
          setTimeout(() => fetchProject(), 0)
        }
      }
    },
    [path]
  )

  // Refetch when diff mode changes
  useEffect(() => {
    if (!path || diffLoading) return
    fetchProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffMode])

  useEffect(() => {
    if (!path) return
    fetchProject(true)
  }, [path, fetchProject])

  useEffect(() => {
    if (!path || !viewingCommitHash) return
    let cancelled = false
    setDiffLoading(true)
    window.api
      .invoke('git:diffForCommit', { path, hash: viewingCommitHash })
      .then((r) => {
        if (cancelled) return
        setFullDiff(r.diff)
        setDiff(r.diff)
        setFiles(r.files)
        setSelectedFile(null)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDiffLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [path, viewingCommitHash])

  const fetchStatus = useCallback(async (): Promise<void> => {
    if (!path) return
    try {
      const s = await window.api.invoke('git:status', { path })
      setRepoStatus(s)
    } catch (e) {
      console.error('[git:status] failed', e)
    }
  }, [path])

  useEffect(() => {
    if (!path) return
    fetchStatus()
    window.api
      .invoke('git:remoteUrl', { path })
      .then((r) => setRemoteWebUrl(r.webUrl))
      .catch(() => setRemoteWebUrl(null))
  }, [path, fetchStatus])

  useEffect(() => {
    if (!repoMenuOpen) return
    const rect = repoMenuButtonRef.current?.getBoundingClientRect()
    if (rect) {
      const w = 224
      setRepoMenuPos({
        left: Math.max(8, rect.right - w),
        top: rect.bottom + 4,
        width: w
      })
    }
    const handler = (e: MouseEvent): void => {
      const t = e.target as Node
      if (
        repoMenuButtonRef.current?.contains(t) ||
        repoMenuPopupRef.current?.contains(t)
      ) return
      setRepoMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [repoMenuOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        setSearchOpen(true)
        setSearchIndex(0)
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'b' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        setSidebarCollapsed((c) => !c)
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchOpen])

  useEffect(() => {
    if (!path) {
      window.api.invoke('menu:setState', {
        hasProject: false,
        branchName: null,
        onBranch: false,
        onDetachedHead: false,
        branchIsUnborn: false,
        onNonDefaultBranch: false,
        hasPublishedBranch: false,
        hasRemote: false,
        isHostedOnGitHub: false,
        hasChangedFiles: false,
        hasStaged: false,
        hasMultipleBranches: false,
        hasConflicts: false,
        rebaseInProgress: false,
        isMerging: false,
        networkInProgress: false,
        branchHasStash: false,
        hasContributionTargetDefaultBranch: false,
        onContributionTargetDefaultBranch: false,
        isAhead: false,
        isBehind: false
      })
      return
    }
    const defaultCandidates = ['main', 'master', 'develop', 'dev']
    const defaultBranch = branches.find((b) => defaultCandidates.includes(b)) ?? null
    const isOnDefault = defaultBranch !== null && branch === defaultBranch
    const onDetachedHead = branch === 'HEAD' || branch === ''
    const branchIsUnborn = !branch
    const onBranch = !!branch && !onDetachedHead && !branchIsUnborn
    const hasChanges = (repoStatus?.files.length ?? 0) > 0
    const hasStaged = (repoStatus?.files ?? []).some(
      (f) => f.staged !== null && f.staged !== 'untracked'
    )
    const hasConflicts = (repoStatus?.files ?? []).some(
      (f) => f.staged === 'conflicted' || f.unstaged === 'conflicted'
    )
    const isGithubHost =
      !!remoteWebUrl &&
      (remoteWebUrl.includes('github.com') || remoteWebUrl.includes('github.'))
    window.api.invoke('menu:setState', {
      hasProject: true,
      branchName: branch || null,
      onBranch,
      onDetachedHead,
      branchIsUnborn,
      onNonDefaultBranch: onBranch && !isOnDefault,
      hasPublishedBranch: !!repoStatus?.upstream,
      hasRemote: !!remoteWebUrl,
      isHostedOnGitHub: isGithubHost,
      hasChangedFiles: hasChanges,
      hasStaged,
      hasMultipleBranches: branches.length > 1,
      hasConflicts,
      rebaseInProgress: !!repoStatus?.isRebasing,
      isMerging: !!repoStatus?.isMerging,
      networkInProgress: false,
      branchHasStash: false,
      hasContributionTargetDefaultBranch: defaultBranch !== null && !isOnDefault,
      onContributionTargetDefaultBranch: isOnDefault,
      isAhead: (repoStatus?.ahead ?? 0) > 0,
      isBehind: (repoStatus?.behind ?? 0) > 0
    })
  }, [path, branch, branches, repoStatus, remoteWebUrl])

  useEffect(() => {
    return window.api.on('menu:action', (event) => {
      const a = event.action
      if (a === 'open-settings') navigate('/settings')
      else if (a === 'go-home') navigate('/home')
      else if (a === 'open-local') {
        window.api.invoke('workspace:pickFolder', undefined).then((r) => {
          if (r) navigate(`/project?path=${encodeURIComponent(r.path)}`)
        })
      }
      else if (a === 'find-in-diff') {
        setSearchOpen(true)
        setSearchIndex(0)
      }
      else if (a === 'git-push') window.api.invoke('git:push', { path }).then(() => { fetchProject(); fetchStatus() })
      else if (a === 'git-pull') window.api.invoke('git:pull', { path }).then(() => { fetchProject(); fetchStatus() })
      else if (a === 'git-fetch') window.api.invoke('git:fetch', { path, prune: true }).then(() => fetchStatus())
      else if (a === 'open-in-editor') window.api.invoke('repository:openInEditor', { path })
      else if (a === 'open-in-terminal') window.api.invoke('repository:openInTerminal', { path })
      else if (a === 'open-in-finder') window.api.invoke('repository:openInFinder', { path })
      else if (a === 'view-on-github' && remoteWebUrl) window.api.invoke('repository:openUrl', { url: remoteWebUrl })
      else if (a === 'create-issue' && remoteWebUrl)
        window.api.invoke('repository:openUrl', { url: `${remoteWebUrl}/issues/new` })
      else if (a === 'new-branch') setNewBranchOpen(true)
      else if (a === 'rename-branch') setRenameOpen(true)
      else if (a === 'delete-branch') setDeleteOpen(true)
      else if (a === 'merge-into-current') setMergeOpen({ strategy: 'merge' })
      else if (a === 'squash-into-current') setMergeOpen({ strategy: 'squash' })
      else if (a === 'rebase-current') setMergeOpen({ strategy: 'rebase' })
      else if (a === 'update-from-default') setMergeOpen({ strategy: 'merge' })
      else if (a === 'compare-to-branch') setMergeOpen({ strategy: 'merge' })
      else if (a === 'compare-on-github' && remoteWebUrl && repoStatus?.branch)
        window.api.invoke('repository:openUrl', {
          url: `${remoteWebUrl}/compare/${repoStatus.branch}`
        })
      else if (a === 'view-branch-on-github' && remoteWebUrl && repoStatus?.branch)
        window.api.invoke('repository:openUrl', {
          url: `${remoteWebUrl}/tree/${repoStatus.branch}`
        })
      else if (a === 'preview-pr') setPrDialogOpen(true)
      else if (a === 'create-pr') setPrDialogOpen(true)
      else if (a === 'discard-all') setDiscardOpen(true)
      else if (a === 'stash-all') {
        window.api.invoke('git:stash', { path, message: '', includeUntracked: false }).then(() => {
          fetchProject()
          fetchStatus()
        })
      }
    })
  }, [navigate, path, fetchProject, fetchStatus, remoteWebUrl, repoStatus])

  // File watcher: re-fetch on save (NÃO dispara análise — botão manual)
  useEffect(() => {
    if (!path) return
    window.api.invoke('workspace:watch', { path })
    const off = window.api.on('workspace:changed', () => {
      clearCacheFor(path)
      fetchProject()
      fetchStatus()
    })
    return () => {
      off()
      window.api.invoke('workspace:unwatch', undefined)
    }
  }, [path, fetchProject])

  // Refetch on window/app focus — pega commits feitos via terminal/IDE externa
  useEffect(() => {
    if (!path) return
    const lastRefreshRef = { current: Date.now() }
    function refresh(): void {
      const now = Date.now()
      if (now - lastRefreshRef.current < 1500) return
      lastRefreshRef.current = now
      clearCacheFor(path)
      fetchProject()
      fetchStatus()
    }
    function onFocus(): void {
      refresh()
    }
    function onVisibility(): void {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [path, fetchProject, fetchStatus])

  // Listen to dock menu / recent doc open requests
  useEffect(() => {
    return window.api.on('app:open-project', (event) => {
      if (event.path && event.path !== path) {
        navigate(`/project?path=${encodeURIComponent(event.path)}`)
      }
    })
  }, [navigate, path])

  useEffect(() => {
    if (professorTurboSaved !== undefined) setProfessorTurbo(Boolean(professorTurboSaved))
  }, [professorTurboSaved])

  useEffect(() => {
    return window.api.on('providers:stream', (event) => {
      if (event.streamId !== streamIdRef.current) return
      if (event.error) {
        setError(event.error)
        setAnalysisState('error')
        return
      }
      if (event.done) {
        setAnalysisState('done')
        return
      }
      setAnalysisText((t) => t + event.chunk)
      setAnalysisState('streaming')
      if (analysisRef.current) {
        analysisRef.current.scrollTop = analysisRef.current.scrollHeight
      }
    })
  }, [])

  async function selectFile(filePath: string): Promise<void> {
    setSelectedFile(filePath)
    if (getMediaKind(filePath)) {
      setDiff('')
      setDiffSwitching(false)
      const f = files.find((x) => x.path === filePath)
      if (f) {
        if (f.status !== 'added') prefetchBlob(path, filePath, 'HEAD')
        if (f.status !== 'deleted') prefetchBlob(path, filePath, null)
      }
      return
    }
    setDiffSwitching(true)
    try {
      const result = await window.api.invoke('workspace:getDiffForFile', {
        path,
        filePath,
        mode: diffMode
      })
      setDiff(result.diff)
    } finally {
      setDiffSwitching(false)
    }
  }

  async function changeDiffMode(next: DiffMode): Promise<void> {
    setDiffMode(next)
    await window.api.invoke('settings:set', { key: 'diff_mode', value: next })
  }

  async function switchBranch(target: string): Promise<void> {
    if (target === branch || checkingOut) return
    setCheckingOut(true)
    try {
      const r = await window.api.invoke('workspace:checkoutBranch', { path, branch: target })
      if (!r.ok) {
        window.alert(`Falha ao trocar de branch:\n\n${r.error ?? 'erro desconhecido'}`)
        return
      }
      await fetchProject()
    } finally {
      setCheckingOut(false)
    }
  }

  function showAllFiles(): void {
    setSelectedFile(null)
    setDiff(fullDiff)
  }

  async function toggleTurbo(): Promise<void> {
    const next = !professorTurbo
    setProfessorTurbo(next)
    await window.api.invoke('settings:set', { key: 'professor_turbo', value: next })
  }

  function startAnalysis(): void {
    if (!fullDiff || files.length === 0 || !settingsReady) return
    runAnalysis(fullDiff)
  }

  const canAnalyze =
    settingsReady && fullDiff && files.length > 0 && analysisState !== 'loading' && analysisState !== 'streaming'

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header — drag area limpa à esquerda, botões à direita */}
      <header
        className="h-10 flex items-stretch border-b border-border/30 bg-background/80 backdrop-blur-xl flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex-1 pl-20" aria-hidden />
        <div
          className="flex items-center gap-1.5 px-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <DiffModeDropdown mode={diffMode} onChange={changeDiffMode} />


          <SyncButton
            path={path}
            status={repoStatus}
            onChanged={() => {
              fetchProject()
              fetchStatus()
            }}
          />

          <div className="relative">
            <Tooltip label="Mais ações do repositório">
              <button
                ref={repoMenuButtonRef}
                onClick={() => setRepoMenuOpen((o) => !o)}
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </Tooltip>
            {repoMenuOpen && repoMenuPos && createPortal(
              <div
                ref={repoMenuPopupRef}
                className="fixed rounded-md border border-border bg-popover shadow-2xl z-[2147483000] overflow-hidden"
                style={{ left: repoMenuPos.left, top: repoMenuPos.top, width: repoMenuPos.width }}
              >
                <RepoMenuItem
                  icon={ExternalLink}
                  label="Abrir no editor"
                  onClick={() => {
                    setRepoMenuOpen(false)
                    window.api.invoke('repository:openInEditor', { path })
                  }}
                />
                <RepoMenuItem
                  icon={Terminal}
                  label="Abrir no terminal"
                  onClick={() => {
                    setRepoMenuOpen(false)
                    window.api.invoke('repository:openInTerminal', { path })
                  }}
                />
                <RepoMenuItem
                  icon={Folder}
                  label="Mostrar no Finder"
                  onClick={() => {
                    setRepoMenuOpen(false)
                    window.api.invoke('repository:openInFinder', { path })
                  }}
                />
                {remoteWebUrl && (
                  <>
                    <div className="border-t border-border/30 my-0.5" />
                    <RepoMenuItem
                      icon={ExternalLink}
                      label="Ver no GitHub"
                      onClick={() => {
                        setRepoMenuOpen(false)
                        window.api.invoke('repository:openUrl', { url: remoteWebUrl })
                      }}
                    />
                    {branch && repoStatus?.branch && (
                      <RepoMenuItem
                        icon={ExternalLink}
                        label="Criar Pull Request"
                        onClick={() => {
                          setRepoMenuOpen(false)
                          window.api.invoke('repository:openUrl', {
                            url: `${remoteWebUrl}/pull/new/${repoStatus.branch}`
                          })
                        }}
                      />
                    )}
                  </>
                )}
                <div className="border-t border-border/30 my-0.5" />
                <RepoMenuItem
                  icon={GitBranch}
                  label="Nova branch"
                  onClick={() => {
                    setRepoMenuOpen(false)
                    setNewBranchOpen(true)
                  }}
                />
                <RepoMenuItem
                  icon={Trash2}
                  label="Descartar tudo"
                  variant="destructive"
                  onClick={() => {
                    setRepoMenuOpen(false)
                    setDiscardOpen(true)
                  }}
                />
              </div>,
              document.body
            )}
          </div>

          <Tooltip
            label={
              !canAnalyze
                ? 'Sem alterações pra analisar'
                : analysisState === 'done'
                  ? 'Explicar de novo · IA revisa o diff'
                  : 'Explicar diff · IA explica o que mudou'
            }
          >
            <button
              onClick={startAnalysis}
              disabled={!canAnalyze}
              className={cn(
                'flex items-center gap-1.5 text-xs rounded-md px-3 h-7 font-medium transition-all',
                canAnalyze
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              <Sparkles className="size-3" />
              {analysisState === 'done' ? 'Explicar de novo' : 'Explicar'}
            </button>
          </Tooltip>

          <Tooltip
            label={
              professorTurbo
                ? 'Professor Turbo ativo · explica conceitos a fundo'
                : 'Ativar Professor Turbo · explicação detalhada'
            }
          >
            <button
              onClick={toggleTurbo}
              className={cn(
                'flex items-center gap-1.5 text-xs rounded-md px-2.5 h-7 border transition-all font-medium',
                professorTurbo
                  ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                  : 'bg-muted/50 border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Zap className="size-3" />
              Turbo
            </button>
          </Tooltip>

          <Tooltip label="Testes IA">
            <button
              onClick={() => navigate('/tests', { state: { projectPath: path } })}
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <FlaskConical className="size-3.5" />
            </button>
          </Tooltip>

          <Tooltip label="Histórico de explicações">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <History className="size-3.5" />
            </button>
          </Tooltip>

          <Tooltip label="Recarregar diff">
            <button
              onClick={() => fetchProject()}
              disabled={diffLoading}
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
            >
              <RefreshCw className={cn('size-3.5', diffLoading && 'animate-spin')} />
            </button>
          </Tooltip>
        </div>
      </header>


      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* SIDEBAR — floating, padding around, rounded corners */}
        {sidebarCollapsed ? (
          <div className="pl-2 pr-1 py-2 flex-shrink-0">
            <aside className="w-12 h-full flex flex-col items-center bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl border border-border/30 shadow-sm py-2 gap-1">
              <Tooltip label="Expandir sidebar" shortcut="⌘B" side="right">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 flex items-center justify-center"
                >
                  <PanelLeftOpen className="size-4" />
                </button>
              </Tooltip>
              <div className="w-6 h-px bg-border/40 my-1" />
              <Tooltip label={`Repositório · ${repoName}`} side="right">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 flex items-center justify-center"
                >
                  <FolderOpen className="size-4" />
                </button>
              </Tooltip>
              {branch && (
                <Tooltip label={`Branch · ${branch}`} side="right">
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(false)}
                    className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 flex items-center justify-center"
                  >
                    <GitBranch className="size-4" />
                  </button>
                </Tooltip>
              )}
              <div className="w-6 h-px bg-border/40 my-1" />
              <Tooltip
                label={`Changes${files.length ? ` (${files.length} arquivo${files.length !== 1 ? 's' : ''})` : ' · sem alterações'}`}
                side="right"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSidebarTab('changes')
                    setViewingCommitHash(null)
                    setSidebarCollapsed(false)
                  }}
                  className={cn(
                    'size-8 rounded-md flex items-center justify-center relative transition-colors',
                    sidebarTab === 'changes'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  )}
                >
                  <GitCommit className="size-4" />
                  {files.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {files.length}
                    </span>
                  )}
                </button>
              </Tooltip>
              <Tooltip label="Histórico de commits" side="right">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarTab('history')
                    setSidebarCollapsed(false)
                  }}
                  className={cn(
                    'size-8 rounded-md flex items-center justify-center transition-colors',
                    sidebarTab === 'history'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  )}
                >
                  <History className="size-4" />
                </button>
              </Tooltip>
            </aside>
          </div>
        ) : (
        <div className="pl-2 pr-1 py-2 flex-shrink-0">
        <aside className="w-[252px] h-full flex flex-col overflow-hidden bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl border border-border/30 shadow-sm">
          {/* Sidebar header */}
          <div className="px-3 pt-2 pb-3 border-b border-border/30">
            <div className="flex items-center gap-1">
              <div className="flex-1 min-w-0">
                <ProjectSwitcher
                  currentName={repoName}
                  currentPath={path}
                  onSwitch={(p) =>
                    navigate(`/project?path=${encodeURIComponent(p)}`)
                  }
                  onCloneRequest={() => setCloneOpen(true)}
                />
              </div>
              <Tooltip label="Colapsar sidebar" shortcut="⌘B">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="flex-shrink-0 size-7 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-accent/60 flex items-center justify-center"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              </Tooltip>
            </div>
            {branch && (
              <div className="mt-1.5">
                <BranchSwitcher
                  path={path}
                  current={branch}
                  onSwitch={async (b) => {
                    await switchBranch(b)
                  }}
                  onCreateRequest={() => setNewBranchOpen(true)}
                />
              </div>
            )}
            <div className="mt-1.5 flex w-full rounded-md border border-border/40 bg-muted/30 p-0.5 gap-0.5 h-7">
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('changes')
                  setViewingCommitHash(null)
                }}
                className={cn(
                  'flex-1 text-[11px] rounded-sm transition-colors',
                  sidebarTab === 'changes'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Changes{files.length > 0 ? ` (${files.length})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('history')}
                className={cn(
                  'flex-1 text-[11px] rounded-sm transition-colors',
                  sidebarTab === 'history'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                History
              </button>
            </div>
            {!diffLoading && (
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground/60">
                  {files.length === 0
                    ? 'sem alterações'
                    : `${files.length} arquivo${files.length !== 1 ? 's' : ''}`}
                </span>
                {files.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-green-500/80 flex items-center gap-0.5">
                      <Plus className="size-2" />
                      {files.reduce((s, f) => s + f.additions, 0)}
                    </span>
                    <span className="text-red-400/80 flex items-center gap-0.5">
                      <Minus className="size-2" />
                      {files.reduce((s, f) => s + f.deletions, 0)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {sidebarTab === 'history' ? (
            <HistoryTab
              path={path}
              refreshKey={historyVersion}
              selectedHash={viewingCommitHash}
              onSelect={(h) => {
                setViewingCommitHash(h)
                if (!h) fetchProject()
              }}
            />
          ) : (
          <div className="flex-1 overflow-y-auto">
            {diffLoading ? (
              <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> carregando...
              </div>
            ) : files.length === 0 ? (
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Salva um arquivo pra começar.</p>
              </div>
            ) : (
              <>
                <button
                  onClick={showAllFiles}
                  className={cn(
                    'w-full text-left px-2.5 h-7 flex items-center gap-2 text-[12px] transition-colors border-b border-border/40',
                    selectedFile === null
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent/60 text-muted-foreground'
                  )}
                >
                  <FileCode className="size-3 flex-shrink-0" />
                  <span className="font-medium">Todos os arquivos</span>
                </button>
                {files.map((f) => {
                  const { name, dir } = splitPath(f.path)
                  const isSelected = selectedFile === f.path
                  return (
                    <button
                      key={f.path}
                      onClick={() => selectFile(f.path)}
                      onMouseEnter={() => {
                        if (getMediaKind(f.path)) {
                          if (f.status !== 'added') prefetchBlob(path, f.path, 'HEAD')
                          if (f.status !== 'deleted') prefetchBlob(path, f.path, null)
                        }
                      }}
                      onDoubleClick={() =>
                        window.api.invoke('repository:openInEditor', { path, file: f.path })
                      }
                      title={`${f.path} · duplo-clique pra abrir no editor`}
                      className={cn(
                        'w-full text-left px-2.5 h-7 flex items-center gap-2 text-[12px] transition-colors border-b border-border/15 last:border-0',
                        isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'
                      )}
                    >
                      <span
                        className={cn(
                          'w-3 text-[10px] font-bold flex-shrink-0 text-center',
                          f.status === 'added'
                            ? 'text-green-500'
                            : f.status === 'deleted'
                              ? 'text-red-500'
                              : f.status === 'renamed'
                                ? 'text-blue-500'
                                : 'text-yellow-500'
                        )}
                      >
                        {f.status === 'added'
                          ? 'A'
                          : f.status === 'deleted'
                            ? 'D'
                            : f.status === 'renamed'
                              ? 'R'
                              : 'M'}
                      </span>
                      <span className="flex-1 min-w-0 truncate">
                        {dir && (
                          <span className="text-muted-foreground/50">{dir}</span>
                        )}
                        <span
                          className={cn(
                            'font-medium',
                            isSelected ? 'text-primary' : 'text-foreground/90'
                          )}
                        >
                          {name}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono flex-shrink-0">
                        {f.additions > 0 && (
                          <span className="text-green-500">+{f.additions}</span>
                        )}
                        {f.deletions > 0 && (
                          <span className="text-red-400">−{f.deletions}</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </>
            )}
          </div>
          )}

          {sidebarTab === 'changes' && branch && (() => {
            const allChanges = (repoStatus?.files ?? []).filter(
              (f) => f.staged !== null || f.unstaged !== null
            )
            const toStage = allChanges
              .filter((f) => f.unstaged !== null)
              .map((f) => f.path)
            return (
              <CommitArea
                path={path}
                branch={branch}
                pendingCount={allChanges.length}
                filesToStage={toStage}
                onCommitted={() => {
                  track('commit_inline_committed')
                  fetchProject()
                  fetchStatus()
                }}
              />
            )
          })()}

          <ProfileMenu />
        </aside>
        </div>
        )}

        <PanelGroup
          direction="horizontal"
          autoSaveId="ds-diff-analysis-split"
          className="flex-1 min-w-0"
        >
        <Panel defaultSize={60} minSize={30}>
        {/* DIFF */}
        <section className="h-full flex flex-col overflow-hidden border-r border-border/40 min-w-0">
          <div className="h-9 flex items-center px-4 border-b border-border/30 gap-2 flex-shrink-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Diff
            </span>
            {selectedFile && (
              <span className="text-xs font-mono text-muted-foreground/50 truncate">
                {selectedFile}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto min-h-0 relative">
            {repoStatus && (repoStatus.isMerging || repoStatus.isRebasing) ? (
              <ConflictResolver
                path={path}
                status={repoStatus}
                onChanged={() => {
                  fetchProject()
                  fetchStatus()
                }}
              />
            ) : (
            <>
            {searchOpen && (
              <DiffSearchBar
                query={searchQuery}
                onQueryChange={(q) => {
                  setSearchQuery(q)
                  setSearchIndex(0)
                }}
                matchCount={diffMatches.length}
                currentIndex={searchIndex}
                onPrev={() =>
                  setSearchIndex((i) => (diffMatches.length === 0 ? 0 : (i - 1 + diffMatches.length) % diffMatches.length))
                }
                onNext={() =>
                  setSearchIndex((i) => (diffMatches.length === 0 ? 0 : (i + 1) % diffMatches.length))
                }
                onClose={() => {
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
              />
            )}
            {diffLoading ? (
              <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> carregando diff...
              </div>
            ) : selectedFile && getMediaKind(selectedFile) ? (
              <>
                <MediaPreview
                  path={path}
                  file={selectedFile}
                  status={files.find((f) => f.path === selectedFile)?.status ?? 'modified'}
                  kind={getMediaKind(selectedFile)!}
                />
                {diffSwitching && (
                  <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[11px] text-muted-foreground bg-background/90 backdrop-blur px-2 py-1 rounded-md border border-border/40">
                    <Loader2 className="size-3 animate-spin" />
                    carregando
                  </div>
                )}
              </>
            ) : diff ? (
              <>
                <DiffViewer
                  diff={diff}
                  hideFileHeaders={selectedFile !== null}
                  comments={lineComments}
                  searchQuery={searchOpen ? searchQuery : ''}
                  searchCurrentIndex={searchIndex}
                  onSearchMatchesChange={setDiffMatches}
                />
                {diffSwitching && (
                  <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[11px] text-muted-foreground bg-background/90 backdrop-blur px-2 py-1 rounded-md border border-border/40">
                    <Loader2 className="size-3 animate-spin" />
                    carregando
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground">Sem alterações.</p>
              </div>
            )}
            </>
            )}
          </div>
        </section>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border/30 hover:bg-primary/60 active:bg-primary transition-colors" />

        <Panel defaultSize={40} minSize={20} collapsible collapsedSize={0} id="analysis-panel">
        {/* ANALYSIS */}
        <section className="h-full flex flex-col overflow-hidden min-w-0">
          <div className="h-9 flex items-center px-4 border-b border-border/30 gap-3 flex-shrink-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Explicação IA
            </span>
            {providerDefault && (
              <span
                className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/70 bg-muted/50 border border-border/40 rounded-md px-1.5 py-0.5"
                title={`${providerDefault} · ${providerModel || ''}`}
              >
                <span className="w-1 h-1 rounded-full bg-primary/70" />
                {(() => {
                  const id = providerDefault as string
                  const list = PROVIDER_MODELS[id]
                  const modelLabel = list?.find((m) => m.id === providerModel)?.label ?? providerModel
                  const providerLabel = PROVIDER_LABELS[id] ?? id
                  return modelLabel ? `${providerLabel} · ${modelLabel}` : providerLabel
                })()}
              </span>
            )}
            {analysisState === 'streaming' && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                escrevendo...
              </div>
            )}
            {analysisState === 'done' && <span className="text-xs text-green-500">✓ pronto</span>}
          </div>

          <div ref={analysisRef} className="flex-1 overflow-auto px-4 py-4 min-h-0">
            {error ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : analysisState === 'loading' ? (
              <AnalysisSkeleton />
            ) : analysisText ? (
              <AnalysisTabs text={analysisText} lineComments={lineComments} />
            ) : (
              <EmptyAnalysis
                ready={!!settingsReady}
                hasDiff={files.length > 0}
                onAnalyze={startAnalysis}
              />
            )}
          </div>
        </section>
        </Panel>
        </PanelGroup>
      </div>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        projectPath={path}
        branch={branch}
        version={historyVersion}
        viewingId={viewingAnalysisId}
        onView={(record) => {
          // Mark as already-persisted so save effect skips even if it fires
          persistedAnalysisRef.current = record.analysis
          setViewingAnalysisId(record.id)
          setHistoryOpen(false)
          setAnalysisText(record.analysis)
          setFullDiff(record.diff)
          setDiff(record.diff)
          setSelectedFile(null)
          setAnalysisState('done')
        }}
        onExitView={() => {
          persistedAnalysisRef.current = ''
          setViewingAnalysisId(null)
          fetchProject()
          setAnalysisText('')
          setAnalysisState('idle')
        }}
      />

      {viewingAnalysisId !== null && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs shadow-xl">
          <History className="size-3" />
          Visualizando explicação antiga
          <button
            type="button"
            onClick={() => {
              setViewingAnalysisId(null)
              fetchProject()
              setAnalysisText('')
              setAnalysisState('idle')
            }}
            className="ml-1 hover:bg-white/20 rounded p-0.5"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <NewBranchDialog
        path={path}
        branches={branches}
        currentBranch={branch}
        open={newBranchOpen}
        onClose={() => setNewBranchOpen(false)}
        onCreated={() => {
          fetchProject()
          fetchStatus()
        }}
      />

      <MergeIntoDialog
        path={path}
        branches={branches}
        currentBranch={branch}
        open={!!mergeOpen}
        defaultStrategy={mergeOpen?.strategy ?? 'merge'}
        onClose={() => setMergeOpen(null)}
        onDone={() => {
          fetchProject()
          fetchStatus()
        }}
      />

      <RenameBranchDialog
        path={path}
        oldName={branch}
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        onDone={() => {
          fetchProject()
          fetchStatus()
        }}
      />

      <DeleteBranchDialog
        path={path}
        branches={branches}
        currentBranch={branch}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDone={() => {
          fetchProject()
          fetchStatus()
        }}
      />

      <OpenPullRequestDialog
        path={path}
        branches={branches}
        defaultBranch={
          branches.find((b) => ['main', 'master', 'develop', 'dev'].includes(b)) ?? null
        }
        currentBranch={branch}
        webUrl={remoteWebUrl}
        open={prDialogOpen}
        onClose={() => setPrDialogOpen(false)}
      />

      <CloneDialog
        open={cloneOpen}
        onClose={() => setCloneOpen(false)}
        onCloned={(p) => navigate(`/project?path=${encodeURIComponent(p)}`)}
      />

      <CommitDialog
        path={path}
        branch={branch}
        stagedCount={
          repoStatus?.files.filter((f) => f.staged !== null && f.staged !== 'untracked').length ?? 0
        }
        open={commitDialogOpen}
        onClose={() => setCommitDialogOpen(false)}
        onCommitted={() => {
          fetchProject()
          fetchStatus()
        }}
      />

      <ConfirmDialog
        open={discardOpen}
        title="Descartar todas as mudanças?"
        message="Vai resetar working dir e index pro último commit. Mudanças perdidas. Confirma?"
        confirmLabel="Descartar tudo"
        variant="destructive"
        busy={discardBusy}
        error={discardError}
        onCancel={() => {
          setDiscardOpen(false)
          setDiscardError('')
        }}
        onConfirm={async () => {
          setDiscardBusy(true)
          setDiscardError('')
          const r = await window.api.invoke('git:discardAll', { path, includeUntracked: false })
          setDiscardBusy(false)
          if (!r.ok) {
            setDiscardError(r.error ?? 'Falha')
            return
          }
          setDiscardOpen(false)
          fetchProject()
          fetchStatus()
        }}
      />
    </div>
  )
}

function RepoMenuItem({
  icon: Icon,
  label,
  onClick,
  variant = 'default'
}: {
  icon: typeof GitBranch
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive'
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors',
        variant === 'destructive'
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground/85 hover:bg-accent/60'
      )}
    >
      <Icon className="size-3 flex-shrink-0" />
      {label}
    </button>
  )
}

interface RecentEntry {
  path: string
  name: string
  lastOpenedAt: number
}

function ProjectSwitcher({
  currentName,
  currentPath,
  onSwitch,
  onCloneRequest
}: {
  currentName: string
  currentPath: string
  onSwitch: (path: string) => void
  onCloneRequest: () => void
}) {
  const [open, setOpen] = useState(false)
  const [recents, setRecents] = useState<RecentEntry[]>([])
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setFilter('')
    setTimeout(() => inputRef.current?.focus(), 50)
    window.api
      .invoke('workspace:recent', undefined)
      .then((rows) => setRecents(rows ?? []))
      .catch(() => setRecents([]))
  }, [open])

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function pickFolder(): Promise<void> {
    setOpen(false)
    const r = await window.api.invoke('workspace:pickFolder', undefined)
    if (r) onSwitch(r.path)
  }

  const others = recents.filter((r) => r.path !== currentPath)
  const q = filter.toLowerCase()
  const filtered = q
    ? others.filter(
        (r) => r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q)
      )
    : others

  return (
    <div ref={ref} className="relative">
      <Tooltip label={`Trocar de repositório · ${currentPath}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'w-full flex items-center gap-2 p-2 rounded-lg transition-colors',
            open ? 'bg-primary/10' : 'hover:bg-accent/60'
          )}
        >
          <Logo size={28} className="rounded-md flex-shrink-0 shadow-sm" />
          <div className="flex-1 min-w-0 text-left flex items-center gap-1.5">
            <FolderOpen className="size-3.5 text-muted-foreground/60 flex-shrink-0" />
            <span className="font-semibold text-sm truncate">{currentName}</span>
          </div>
          <ChevronDown
            className={cn(
              'size-3.5 text-muted-foreground/60 flex-shrink-0 transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      </Tooltip>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[200] rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40">
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar repositórios…"
              className="flex-1 bg-transparent text-[11px] focus:outline-none"
            />
          </div>
          {filtered.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 border-b border-border/30">
                Recentes ({filtered.length})
              </div>
              {filtered.map((r) => (
                <button
                  key={r.path}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onSwitch(r.path)
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-accent transition-colors text-left"
                >
                  <Folder className="size-3.5 text-muted-foreground/70 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground/60 font-mono truncate">
                      {r.path}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-3 text-[11px] text-muted-foreground italic">
              {q ? 'Nada com esse filtro.' : 'Sem outros projetos abertos.'}
            </p>
          )}
          <div className="border-t border-border/40">
            <button
              type="button"
              onClick={pickFolder}
              className="w-full px-3 py-2.5 flex items-center gap-2 text-xs hover:bg-accent transition-colors text-left"
            >
              <FolderPlus className="size-3.5 text-muted-foreground" />
              Abrir outro projeto
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onCloneRequest()
              }}
              className="w-full px-3 py-2.5 flex items-center gap-2 text-xs hover:bg-accent transition-colors text-left border-t border-border/30"
            >
              <FolderPlus className="size-3.5 text-muted-foreground" />
              Clonar repositório…
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SENIORITY_LABELS: Record<string, string> = {
  intern: 'estagiário',
  junior: 'júnior',
  mid: 'pleno',
  senior: 'sênior'
}

function ProfileMenu() {
  const navigate = useNavigate()
  const { value: userName } = useSettings('user_name')
  const { value: seniority } = useSettings('seniority')
  const { value: avatar } = useSettings('user_avatar')
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const initial = (userName || 'D').slice(0, 1).toUpperCase()

  function cycleTheme(): void {
    const order: ThemeMode[] = ['light', 'dark', 'auto']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
    window.api.invoke('settings:set', { key: 'theme', value: next })
  }

  async function logout(): Promise<void> {
    await window.api.invoke('settings:set', { key: 'onboarding_completed', value: false })
    setOpen(false)
    navigate('/')
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <div ref={ref} className="border-t border-border/40 p-2 relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors',
          open ? 'bg-primary/10' : 'hover:bg-accent/60'
        )}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0 overflow-hidden">
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs font-medium truncate">{userName || 'Dev'}</div>
          <div className="text-[10px] text-muted-foreground truncate">
            {seniority ? SENIORITY_LABELS[seniority as string] ?? seniority : 'developer'}
          </div>
        </div>
        <ChevronUp
          className={cn(
            'size-3 text-muted-foreground transition-transform flex-shrink-0',
            !open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%-4px)] left-2 right-2 mb-1 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden z-50">
          <button
            onClick={cycleTheme}
            className="w-full px-3 py-2.5 flex items-center gap-2.5 text-xs hover:bg-accent transition-colors text-left"
          >
            <ThemeIcon className="size-3.5 text-muted-foreground" />
            <span>Alterar tema</span>
            <span className="ml-auto text-[10px] text-muted-foreground/60 capitalize">{theme}</span>
          </button>
          <button
            onClick={() => {
              setOpen(false)
              navigate('/settings')
            }}
            className="w-full px-3 py-2.5 flex items-center gap-2.5 text-xs hover:bg-accent transition-colors text-left border-t border-border/40"
          >
            <SettingsIcon className="size-3.5 text-muted-foreground" />
            Configurações
          </button>
          <button
            onClick={logout}
            className="w-full px-3 py-2.5 flex items-center gap-2.5 text-xs hover:bg-destructive/10 transition-colors text-left border-t border-border/40 text-destructive"
          >
            <LogOut className="size-3.5" />
            Refazer onboarding
          </button>
        </div>
      )}
    </div>
  )
}

function EmptyAnalysis({
  ready,
  hasDiff,
  onAnalyze
}: {
  ready: boolean
  hasDiff: boolean
  onAnalyze: () => void
}) {
  if (!ready) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> carregando configurações...
      </div>
    )
  }
  if (!hasDiff) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
          <Sparkles className="size-5 text-muted-foreground/40" />
        </div>
        <p className="text-xs text-muted-foreground">
          Sem alterações pra explicar.
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-1">
          Edita um arquivo e clica em Explicar.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
        <Sparkles className="size-5 text-primary" />
      </div>
      <p className="text-xs text-foreground/80 mb-1">Pronto pra explicar.</p>
      <p className="text-[11px] text-muted-foreground/60 mb-4">
        Clica em Explicar quando quiser entender o que mudou.
      </p>
      <button
        onClick={onAnalyze}
        className="flex items-center gap-1.5 text-xs rounded-md px-3 h-7 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Sparkles className="size-3" />
        Explicar agora
      </button>
    </div>
  )
}

const ANALYSIS_MESSAGES = [
  'Tokenizando diff...',
  'Construindo grafo de dependências...',
  'Inferindo intenção das mudanças...',
  'Cruzando contexto com senioridade...',
  'Detectando code smells e race conditions...',
  'Avaliando trade-offs arquiteturais...',
  'Compondo explicação final...'
]

const L1 = [
  { x: 30, y: 24 },
  { x: 30, y: 60 },
  { x: 30, y: 100 },
  { x: 30, y: 140 }
]
const L2 = [
  { x: 160, y: 14 },
  { x: 160, y: 50 },
  { x: 160, y: 86 },
  { x: 160, y: 122 },
  { x: 160, y: 158 }
]
const L3 = [
  { x: 290, y: 40 },
  { x: 290, y: 86 },
  { x: 290, y: 132 }
]

const EDGES_12: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
L1.forEach((a, i) =>
  L2.forEach((b, j) => EDGES_12.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `12-${i}-${j}` }))
)
const EDGES_23: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
L2.forEach((a, i) =>
  L3.forEach((b, j) => EDGES_23.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `23-${i}-${j}` }))
)

function NeuralNet() {
  return (
    <svg
      viewBox="0 0 320 172"
      className="w-full max-w-[340px] h-auto"
      aria-hidden
    >
      <defs>
        <filter id="ds-nn-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="ds-nn-edge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* base edges (dim) */}
      {[...EDGES_12, ...EDGES_23].map((e) => (
        <line
          key={`b-${e.key}`}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="currentColor"
          strokeOpacity="0.10"
          strokeWidth="0.6"
        />
      ))}

      {/* traveling pulse edges (subset) */}
      {[...EDGES_12, ...EDGES_23]
        .filter((_, i) => i % 4 === 0)
        .map((e, i) => (
          <line
            key={`p-${e.key}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="url(#ds-nn-edge)"
            strokeWidth="1.2"
            strokeDasharray="14 56"
            className="ds-nn-trace"
            style={{ animationDelay: `${(i * 0.18) % 2.4}s` }}
          />
        ))}

      {/* nodes */}
      {[...L1, ...L2, ...L3].map((n, i) => (
        <g key={`n-${i}`} filter="url(#ds-nn-glow)">
          <circle
            cx={n.x}
            cy={n.y}
            r="4"
            className="fill-primary ds-nn-pulse"
            style={{ animationDelay: `${(i * 0.12) % 1.8}s` }}
          />
          <circle cx={n.x} cy={n.y} r="2" fill="white" opacity="0.85" />
        </g>
      ))}

      {/* layer labels */}
      <g className="text-[7px] fill-current opacity-30 font-mono">
        <text x="14" y="172">input</text>
        <text x="143" y="172">hidden</text>
        <text x="270" y="172">output</text>
      </g>
    </svg>
  )
}

function AnalysisSkeleton() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % ANALYSIS_MESSAGES.length),
      1700
    )
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-8 select-none text-primary">
      <NeuralNet />

      {/* status with rotating message */}
      <div className="mt-5 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span
          key={idx}
          className="ds-fade-up text-[12px] font-mono tracking-tight text-foreground/85"
        >
          {ANALYSIS_MESSAGES[idx]}
        </span>
      </div>

      {/* token stream */}
      <div className="mt-5 w-full max-w-[340px] overflow-hidden rounded-md border border-border/30 bg-muted/20 px-2 py-1.5 font-mono text-[10px] text-primary/70 ds-token-stream">
        <span className="ds-token-row">
          0x7f3 → embed → softmax → attn → mlp → norm → logit → emit
          0x7f3 → embed → softmax → attn → mlp → norm → logit → emit
        </span>
      </div>

      {/* progress bars */}
      <div className="mt-4 w-full max-w-[340px] space-y-2">
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div className="h-full w-full ds-shimmer" />
        </div>
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden w-5/6">
          <div className="h-full w-full ds-shimmer" style={{ animationDelay: '0.25s' }} />
        </div>
      </div>
    </div>
  )
}

const DiffViewer = React.memo(function DiffViewer({
  diff,
  hideFileHeaders = false,
  comments = [],
  searchQuery = '',
  searchCurrentIndex = 0,
  onSearchMatchesChange
}: {
  diff: string
  hideFileHeaders?: boolean
  comments?: LineComment[]
  searchQuery?: string
  searchCurrentIndex?: number
  onSearchMatchesChange?: (matches: Array<{ lineIdx: number }>) => void
}) {
  const sections = useMemo(() => parseDiff(diff), [diff])
  const commentMap = useMemo(() => {
    const map = new Map<string, LineComment>()
    for (const c of comments) {
      map.set(`${c.file}:${c.line}`, c)
    }
    return map
  }, [comments])
  const { variant: codeVariant } = useCodeTheme()
  const prismTheme = codeVariant.prism

  const matches = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    const out: Array<{ lineIdx: number }> = []
    sections.forEach((s, i) => {
      if (s.kind === 'line' && s.content.toLowerCase().includes(q)) {
        out.push({ lineIdx: i })
      }
    })
    return out
  }, [sections, searchQuery])

  useEffect(() => {
    onSearchMatchesChange?.(matches)
  }, [matches, onSearchMatchesChange])

  const currentMatchLineIdx =
    matches.length > 0 ? matches[searchCurrentIndex % matches.length]?.lineIdx ?? -1 : -1

  const matchRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  useEffect(() => {
    if (currentMatchLineIdx >= 0) {
      const el = matchRefs.current.get(currentMatchLineIdx)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [currentMatchLineIdx])

  return (
    <div className="text-xs font-mono leading-5 select-text">
      {sections.map((s, i) => {
        if (s.kind === 'fileHeader') {
          if (hideFileHeaders) return null
          const parts = s.path.split('/')
          const name = parts.pop() ?? s.path
          const dir = parts.length > 0 ? parts.join('/') + '/' : ''
          return (
            <div
              key={i}
              className="px-4 py-2 mt-3 first:mt-0 flex items-center gap-2 bg-muted/30 border-y border-border/30 sticky top-0 z-10 backdrop-blur-sm"
            >
              {s.status && (
                <span
                  className={cn(
                    'text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold',
                    s.status === 'new' && 'bg-green-500/15 text-green-400',
                    s.status === 'deleted' && 'bg-red-500/15 text-red-400',
                    s.status === 'renamed' && 'bg-blue-500/15 text-blue-400'
                  )}
                >
                  {s.status === 'new' ? 'novo' : s.status === 'deleted' ? 'excluído' : 'renomeado'}
                </span>
              )}
              {dir && <span className="text-[11px] text-muted-foreground/60">{dir}</span>}
              <span className="text-[12px] font-medium text-foreground/90">{name}</span>
            </div>
          )
        }
        if (s.kind === 'hunkBreak') {
          return (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5">
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
                ···
              </span>
              <div className="flex-1 h-px bg-border/30" />
            </div>
          )
        }

        const isAdd = s.type === 'add'
        const isDel = s.type === 'del'
        const fileBase = basename(s.file)
        const comment =
          isAdd && s.newNum != null ? commentMap.get(`${fileBase}:${s.newNum}`) : undefined

        const isMatch = searchQuery && searchQuery.length >= 2 && s.content.toLowerCase().includes(searchQuery.toLowerCase())
        const isCurrentMatch = i === currentMatchLineIdx

        return (
          <React.Fragment key={i}>
            <div
              ref={(el) => {
                if (el && isMatch) matchRefs.current.set(i, el)
                else matchRefs.current.delete(i)
              }}
              className={cn(
                'flex',
                isAdd && 'bg-green-500/8',
                isDel && 'bg-red-500/8',
                comment && 'border-l-2 border-primary/60',
                isMatch && !isCurrentMatch && 'ring-1 ring-primary/40 ring-inset',
                isCurrentMatch && 'ring-2 ring-primary ring-inset bg-primary/10'
              )}
            >
              <div
                className={cn(
                  'w-10 text-right pr-2 select-none flex-shrink-0 text-[10px] leading-5',
                  isAdd
                    ? 'text-green-500/40'
                    : isDel
                      ? 'text-red-500/40'
                      : 'text-muted-foreground/20'
                )}
              >
                {s.newNum ?? ''}
              </div>
              <div
                className={cn(
                  'w-5 text-center select-none flex-shrink-0 leading-5',
                  isAdd ? 'text-green-400/70' : isDel ? 'text-red-400/70' : 'text-transparent'
                )}
              >
                {isAdd ? '+' : isDel ? '-' : ' '}
              </div>
              <div
                className={cn(
                  'flex-1 min-w-0 pr-4 leading-5 whitespace-pre-wrap break-all',
                  isDel && 'opacity-70'
                )}
              >
                {s.content ? (
                  <HighlightedCode
                    code={s.content}
                    language={detectLanguage(s.file)}
                    prismTheme={prismTheme}
                  />
                ) : (
                  '\u00A0'
                )}
              </div>
              {comment && (
                <Sparkles className="size-3 text-primary mr-3 mt-1 flex-shrink-0 animate-pulse" />
              )}
            </div>
            {comment && <InlineBalloon comment={comment} />}
          </React.Fragment>
        )
      })}
    </div>
  )
})

function InlineBalloon({ comment }: { comment: LineComment }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="pl-12 pr-4 py-2 bg-primary/[0.04] border-l-2 border-primary/60 font-sans">
      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left group"
        >
          <Sparkles className="size-3 text-primary flex-shrink-0" />
          <span className="text-[12px] font-medium text-foreground flex-1 truncate">
            {comment.title || `Linha ${comment.line}`}
          </span>
          <ChevronDown
            className={cn(
              'size-3 text-muted-foreground/60 transition-transform flex-shrink-0',
              !open && '-rotate-90'
            )}
          />
        </button>
        <AskAIInline
          context={buildCommentContext(comment)}
          contextLabel={comment.title || `L${comment.line}`}
        />
      </div>
      {open && (
        <div className="mt-2 ml-5 space-y-2 text-[12px] leading-relaxed">
          {comment.why && (
            <div className="text-foreground/85">
              <span className="font-semibold text-foreground/70">Por que: </span>
              {renderInline(comment.why)}
            </div>
          )}
          {comment.concepts && comment.concepts.length > 0 && (
            <div>
              <div className="font-semibold text-foreground/70 mb-1">Conceitos:</div>
              <ul className="space-y-0.5 ml-1">
                {comment.concepts.map((c, idx) => (
                  <li key={idx} className="flex gap-1.5 text-foreground/80 items-start">
                    <span className="text-primary/60 mt-0.5">•</span>
                    <span className="flex-1">
                      {c.code && (
                        <code className="bg-muted px-1 rounded text-[11px] font-mono text-primary/80 mr-1">
                          {c.code}
                        </code>
                      )}
                      {renderInline(c.text)}
                    </span>
                    <AskAIInline
                      context={(c.code ? `\`${c.code}\`: ` : '') + c.text}
                      contextLabel={c.code ?? c.text.slice(0, 40)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function splitAnalysis(text: string): { summary: string; details: string } {
  const summaryMatch = text.match(/##\s+Resumo\s*\n([\s\S]*?)(?=\n##\s+Detalhes|\n##\s+\w|$)/i)
  const detailsMatch = text.match(/##\s+Detalhes\s*\n([\s\S]*)$/i)
  const summary = summaryMatch ? summaryMatch[1].trim() : ''
  const details = detailsMatch ? detailsMatch[1].trim() : (summary ? '' : text)
  return { summary, details }
}

function AnalysisTabs({
  text,
  lineComments
}: {
  text: string
  lineComments: LineComment[]
}) {
  const [tab, setTab] = useState<'summary' | 'details' | 'concepts'>('summary')
  const { summary, details } = useMemo(() => splitAnalysis(text), [text])
  const concepts = useMemo(() => {
    const map = new Map<string, { code?: string; text: string; refs: number[] }>()
    for (const c of lineComments) {
      for (const concept of c.concepts ?? []) {
        const key = (concept.code ?? '') + '|' + concept.text
        const existing = map.get(key)
        if (existing) existing.refs.push(c.line)
        else map.set(key, { ...concept, refs: [c.line] })
      }
    }
    return [...map.values()]
  }, [lineComments])

  // auto-pick first non-empty tab
  useEffect(() => {
    if (tab === 'summary' && !summary && details) setTab('details')
  }, [summary, details, tab])

  const TABS: { id: typeof tab; label: string; count?: number }[] = [
    { id: 'summary', label: 'Resumo' },
    { id: 'details', label: 'Detalhes', count: lineComments.length || undefined },
    { id: 'concepts', label: 'Conceitos', count: concepts.length || undefined }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-0.5 -mt-1 mb-3 sticky top-0 bg-background/90 backdrop-blur z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 h-7 text-xs rounded-md transition-colors flex items-center gap-1.5',
              tab === t.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            {t.label}
            {t.count != null && (
              <span
                className={cn(
                  'text-[10px] rounded-full px-1.5 leading-tight',
                  tab === t.id ? 'bg-primary/20' : 'bg-muted'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'summary' && (
          summary ? (
            <AnalysisText text={summary} />
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Resumo ainda não disponível.
            </p>
          )
        )}
        {tab === 'details' && (
          lineComments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Sem detalhes por linha.
            </p>
          ) : (
            <ul className="space-y-2">
              {lineComments.map((c, i) => (
                <CollapsibleComment key={i} comment={c} />
              ))}
            </ul>
          )
        )}
        {tab === 'concepts' && (
          concepts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Nenhum conceito identificado nessa explicação.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {concepts.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border/40 bg-card/50 p-3 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.code && (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary">
                        {c.code}
                      </code>
                    )}
                    <span className="text-[10px] text-muted-foreground/60">
                      {c.refs.length === 1
                        ? `linha ${c.refs[0]}`
                        : `${c.refs.length} ocorrências`}
                    </span>
                    <AskAIInline
                      context={(c.code ? `\`${c.code}\`: ` : '') + c.text}
                      contextLabel={c.code ?? c.text.slice(0, 40)}
                      className="ml-auto"
                    />
                  </div>
                  <span className="text-xs text-foreground/80 leading-relaxed">
                    {renderInline(c.text)}
                  </span>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}

interface HistoryItem {
  id: number
  branch: string
  diffMode: string
  filesCount: number
  additions: number
  deletions: number
  providerId: string
  title: string | null
  createdAt: number
}

interface AnalysisRecord {
  id: number
  branch: string
  diffMode: string
  filesCount: number
  diff: string
  analysis: string
  title: string | null
  createdAt: number
}

const TIME_FORMATTER = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
function timeAgo(ts: number): string {
  const diffMin = Math.round((ts - Date.now()) / 60_000)
  if (Math.abs(diffMin) < 60) return TIME_FORMATTER.format(diffMin, 'minute')
  const diffH = Math.round(diffMin / 60)
  if (Math.abs(diffH) < 24) return TIME_FORMATTER.format(diffH, 'hour')
  const diffD = Math.round(diffH / 24)
  return TIME_FORMATTER.format(diffD, 'day')
}

function HistoryDrawer({
  open,
  onClose,
  projectPath,
  branch,
  version,
  viewingId,
  onView,
  onExitView
}: {
  open: boolean
  onClose: () => void
  projectPath: string
  branch: string
  version: number
  viewingId: number | null
  onView: (record: AnalysisRecord) => void
  onExitView: () => void
}) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [filter, setFilter] = useState<'branch' | 'all'>('branch')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !projectPath) return
    setLoading(true)
    window.api
      .invoke('analyses:list', {
        path: projectPath,
        branch: filter === 'branch' ? branch : undefined
      })
      .then((rows) => setItems(rows ?? []))
      .finally(() => setLoading(false))
  }, [open, projectPath, branch, filter, version])

  async function loadItem(id: number): Promise<void> {
    const r = await window.api.invoke('analyses:get', { id })
    if (r) onView(r as AnalysisRecord)
  }

  async function deleteItem(id: number, e: React.MouseEvent): Promise<void> {
    e.stopPropagation()
    await window.api.invoke('analyses:delete', { id })
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (id === viewingId) onExitView()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40 backdrop-blur-sm" />
      <aside
        className="w-[420px] h-full bg-card border-l border-border shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="h-12 px-4 flex items-center gap-2 border-b border-border/40 flex-shrink-0">
          <History className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Histórico de explicações</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="px-4 py-2 flex items-center gap-1 border-b border-border/30 flex-shrink-0">
          <button
            type="button"
            onClick={() => setFilter('branch')}
            className={cn(
              'px-2.5 h-7 text-xs rounded transition-colors',
              filter === 'branch'
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
            )}
          >
            Branch atual
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-2.5 h-7 text-xs rounded transition-colors',
              filter === 'all'
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
            )}
          >
            Todas
          </button>
          <span className="ml-auto text-[10px] text-muted-foreground/60">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loading ? (
            <p className="text-xs text-muted-foreground p-3">Carregando...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Sparkles className="size-6 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                Nenhuma explicação salva{' '}
                {filter === 'branch' ? 'nessa branch' : 'nesse projeto'} ainda.
              </p>
            </div>
          ) : (
            items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => loadItem(it.id)}
                className={cn(
                  'w-full text-left rounded-lg border p-2.5 transition-colors group',
                  viewingId === it.id
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/40 hover:bg-accent/40'
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate text-foreground/90">
                      {it.title || `${it.filesCount} arquivos`}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/70 font-mono">
                      <span className="flex items-center gap-0.5">
                        <GitBranch className="size-2.5" />
                        {it.branch}
                      </span>
                      <span>·</span>
                      <span>{timeAgo(it.createdAt)}</span>
                      <span>·</span>
                      <span>{it.providerId}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="text-muted-foreground/60">
                        {it.filesCount} arq
                      </span>
                      {it.additions > 0 && (
                        <span className="text-green-500/80 flex items-center gap-0.5">
                          <Plus className="size-2" />
                          {it.additions}
                        </span>
                      )}
                      {it.deletions > 0 && (
                        <span className="text-red-400/80 flex items-center gap-0.5">
                          <Minus className="size-2" />
                          {it.deletions}
                        </span>
                      )}
                    </div>
                  </div>
                  <Tooltip label="Apagar explicação">
                    <button
                      type="button"
                      onClick={(e) => deleteItem(it.id, e)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </Tooltip>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}

function buildCommentContext(c: LineComment): string {
  const parts: string[] = []
  parts.push(`Arquivo: ${c.file} · Linha ${c.line}`)
  if (c.title) parts.push(`Título: ${c.title}`)
  if (c.before) parts.push(`Antes:\n\`\`\`\n${c.before}\n\`\`\``)
  if (c.after) parts.push(`Depois:\n\`\`\`\n${c.after}\n\`\`\``)
  if (c.why) parts.push(`Por que: ${c.why}`)
  if (c.concepts && c.concepts.length > 0) {
    parts.push(
      'Conceitos:\n' +
        c.concepts.map((cc) => `- ${cc.code ? '`' + cc.code + '`: ' : ''}${cc.text}`).join('\n')
    )
  }
  return parts.join('\n\n')
}

function CollapsibleComment({ comment }: { comment: LineComment }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
      <div
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 transition-colors',
          open ? 'bg-primary/8' : 'hover:bg-accent/40'
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span className="text-[11px] font-mono text-muted-foreground/70 flex-shrink-0">
            L{comment.line}
          </span>
          <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 truncate max-w-[120px]">
            {comment.file}
          </span>
          <span className="text-[12px] font-medium text-foreground flex-1 truncate">
            {comment.title || 'sem título'}
          </span>
          <ChevronDown
            className={cn(
              'size-3.5 text-muted-foreground/60 flex-shrink-0 transition-transform',
              !open && '-rotate-90'
            )}
          />
        </button>
        <AskAIInline
          context={buildCommentContext(comment)}
          contextLabel={comment.title || `L${comment.line}`}
        />
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2.5 text-[12px]">
          {comment.before && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                Antes
              </div>
              <pre className="bg-muted/40 border border-border/40 rounded-md px-2.5 py-1.5 overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/85">
                {comment.before}
              </pre>
            </div>
          )}
          {comment.after && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                Depois
              </div>
              <pre className="bg-muted/40 border border-border/40 rounded-md px-2.5 py-1.5 overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/85">
                {comment.after}
              </pre>
            </div>
          )}
          {comment.why && (
            <div className="text-foreground/85 leading-relaxed">
              <span className="font-semibold text-foreground/70">Por que: </span>
              {renderInline(comment.why)}
            </div>
          )}
          {comment.concepts && comment.concepts.length > 0 && (
            <div>
              <div className="font-semibold text-foreground/70 mb-1">Conceitos:</div>
              <ul className="space-y-0.5 ml-1">
                {comment.concepts.map((c, idx) => (
                  <li key={idx} className="flex gap-1.5 text-foreground/80 leading-relaxed items-start">
                    <span className="text-primary/60 mt-0.5">•</span>
                    <span className="flex-1">
                      {c.code && (
                        <code className="bg-muted px-1 rounded text-[11px] font-mono text-primary/80 mr-1">
                          {c.code}
                        </code>
                      )}
                      {renderInline(c.text)}
                    </span>
                    <AskAIInline
                      context={(c.code ? `\`${c.code}\`: ` : '') + c.text}
                      contextLabel={c.code ?? c.text.slice(0, 40)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function AnalysisText({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let codeBuffer: string[] | null = null
  let codeKey = 0

  lines.forEach((line, i) => {
    // code fence
    if (line.startsWith('```')) {
      if (codeBuffer === null) {
        codeBuffer = []
      } else {
        blocks.push(
          <pre
            key={`code-${codeKey++}`}
            className="bg-muted/40 border border-border/40 rounded-md px-3 py-2 my-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/85"
          >
            {codeBuffer.join('\n')}
          </pre>
        )
        codeBuffer = null
      }
      return
    }
    if (codeBuffer !== null) {
      codeBuffer.push(line)
      return
    }

    if (line.startsWith('### '))
      blocks.push(
        <h3
          key={i}
          className="font-semibold text-sm mt-5 mb-2 text-foreground bg-primary/8 -mx-1 px-2 py-1.5 rounded-md border-l-2 border-primary"
        >
          {renderInline(line.slice(4))}
        </h3>
      )
    else if (line.startsWith('## '))
      blocks.push(
        <h2 key={i} className="font-bold text-base mt-6 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      )
    else if (line.startsWith('# '))
      blocks.push(
        <h1 key={i} className="font-bold text-lg mt-6 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      )
    else if (line.startsWith('- ') || line.startsWith('* '))
      blocks.push(
        <div key={i} className="flex gap-2 mb-1.5">
          <span className="text-primary/50 flex-shrink-0 mt-0.5 text-xs">•</span>
          <span className="text-sm text-foreground/80">{renderInline(line.slice(2))}</span>
        </div>
      )
    else if (line.startsWith('---'))
      blocks.push(<hr key={i} className="border-border/30 my-4" />)
    else if (!line.trim()) blocks.push(<div key={i} className="h-2" />)
    else
      blocks.push(
        <p key={i} className="text-sm text-foreground/80 mb-1">
          {renderInline(line)}
        </p>
      )
  })

  // flush trailing code
  const trailingBuffer = codeBuffer as string[] | null
  if (trailingBuffer !== null) {
    blocks.push(
      <pre
        key={`code-${codeKey++}`}
        className="bg-muted/40 border border-border/40 rounded-md px-3 py-2 my-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/85"
      >
        {trailingBuffer.join('\n')}
      </pre>
    )
  }

  return <div className="text-sm leading-relaxed">{blocks}</div>
}
