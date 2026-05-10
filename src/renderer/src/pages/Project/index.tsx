import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bug,
  GitBranch,
  Home,
  Lightbulb,
  MessageCircleQuestion,
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
  Terminal,
  ExternalLink,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  CheckCircle2
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import { buildDiffPrompt } from '@/lib/diffPrompt'
import type { DiffFile } from '@shared/git'
import type { SeniorityLevel } from '@shared/seniority'
import type { ThemeMode, DiffMode, ExplanationDepth } from '@shared/settings'
import type { PersonaId } from '@shared/personas'
import DepthSlider from '@/components/analysis/DepthSlider'
import PersonaPicker from '@/components/analysis/PersonaPicker'
import Quiz from '@/components/analysis/Quiz'
import TermLink from '@/components/analysis/TermLink'
import MasteryDots from '@/components/analysis/MasteryDots'
import ComplexityBadge from '@/components/analysis/ComplexityBadge'
import AuthorshipBadge from '@/components/analysis/AuthorshipBadge'
import CheatSheetDialog from '@/components/CheatSheetDialog'
import WhatIfDialog from '@/components/WhatIfDialog'
import BugHuntDialog from '@/components/BugHuntDialog'
import { detectTerms } from '@/lib/termDetector'
import { useConceptMastery } from '@/hooks/useConceptMastery'
import { cn } from '@/lib/utils'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle
} from 'react-resizable-panels'
import { PROVIDER_MODELS, PROVIDER_LABELS } from '@/lib/providerModels'
import { Highlight, type PrismTheme } from 'prism-react-renderer'
import AskAIInline from '@/components/AskAIInline'
import { useCodeTheme } from '@/hooks/useCodeTheme'
import DiffSearchBar from '@/components/git/DiffSearchBar'
import { track } from '@/lib/telemetry'
import DiffModeDropdown from '@/components/git/DiffModeDropdown'
import BranchSwitcher from '@/components/git/BranchSwitcher'
import HistoryTab from '@/components/git/HistoryTab'
import ConflictResolver from '@/components/git/ConflictResolver'
import MediaPreview, { getMediaKind } from '@/components/git/MediaPreview'
import NoChangesEmptyState from '@/components/git/NoChangesEmptyState'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu'
import { prefetchBlob, trimCache, clearCacheFor } from '@/lib/mediaCache'
import Tooltip from '@/components/ui/Tooltip'
import Logo from '@/components/Logo'
import AccountMenu from '@/components/AccountMenu'
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

function renderTermLinks(plain: string, baseKey: number): React.ReactNode[] {
  const matches = detectTerms(plain)
  if (matches.length === 0) return [plain]
  const out: React.ReactNode[] = []
  let cursor = 0
  matches.forEach((m, idx) => {
    if (m.start > cursor) out.push(plain.slice(cursor, m.start))
    out.push(
      <TermLink
        key={`tl-${baseKey}-${idx}`}
        term={m.term}
        contextSnippet={plain.slice(Math.max(0, m.start - 60), Math.min(plain.length, m.end + 60))}
      />
    )
    cursor = m.end
  })
  if (cursor < plain.length) out.push(plain.slice(cursor))
  return out
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  const out: React.ReactNode[] = []
  parts.forEach((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push(
        <code key={`c-${i}`} className="bg-muted px-1 rounded text-[11px] font-mono text-primary/80">
          {part.slice(1, -1)}
        </code>
      )
      return
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      out.push(
        <strong key={`b-${i}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
      return
    }
    for (const node of renderTermLinks(part, i)) out.push(node)
  })
  return out
}

export default function Project() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const path = params.get('path') ?? ''
  const repoName = path.split('/').pop() ?? 'projeto'

  const { value: seniority, loading: seniorityLoading } = useSettings('seniority')
  const { value: providerDefault, loading: providerLoading } = useSettings('provider_default')
  const { value: providerModel } = useSettings('provider_model')
  const { value: explanationDepthSaved } = useSettings('explanation_depth')
  const { value: explanationPersonaSaved } = useSettings('explanation_persona')
  const { value: socraticModeSaved } = useSettings('socratic_mode')
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
  const [explanationDepth, setExplanationDepth] = useState<ExplanationDepth>(3)
  const [explanationPersona, setExplanationPersona] = useState<PersonaId>('default')
  const [socraticMode, setSocraticMode] = useState(false)
  const professorTurbo = explanationDepth >= 5
  const [historyOpen, setHistoryOpen] = useState(false)
  const [viewingAnalysisId, setViewingAnalysisId] = useState<number | null>(null)
  const [savedAnalysisId, setSavedAnalysisId] = useState<number | null>(null)
  const [cheatSheet, setCheatSheet] = useState<{ open: boolean; selection: string }>({
    open: false,
    selection: ''
  })
  const [whatIfOpen, setWhatIfOpen] = useState(false)
  const [bugHunt, setBugHunt] = useState<{ open: boolean; snippet: string }>({
    open: false,
    snippet: ''
  })
  const [error, setError] = useState('')
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState(0)
  const [diffMatches, setDiffMatches] = useState<Array<{ lineIdx: number }>>([])
  const [sidebarTab, setSidebarTab] = useState<'changes' | 'history'>('changes')
  const [viewingCommitHash, setViewingCommitHash] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null)
  const [repoMenuOpen, setRepoMenuOpen] = useState(false)
  const [repoMenuPos, setRepoMenuPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const repoMenuButtonRef = useRef<HTMLButtonElement>(null)
  const repoMenuPopupRef = useRef<HTMLDivElement>(null)
  const [remoteWebUrl, setRemoteWebUrl] = useState<string | null>(null)

  const lineComments = useMemo(() => parseLineComments(analysisText), [analysisText])

  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('summary')
  const conceptsCount = useMemo(() => {
    const seen = new Set<string>()
    for (const c of lineComments) {
      for (const concept of c.concepts ?? []) {
        seen.add((concept.code ?? '') + '|' + concept.text)
      }
    }
    return seen.size
  }, [lineComments])
  // Auto-pick details when summary is empty but details exist
  useEffect(() => {
    if (!analysisText) return
    const hasSummary = /##\s+Resumo/i.test(analysisText)
    if (!hasSummary && lineComments.length > 0 && analysisTab === 'summary') {
      setAnalysisTab('details')
    }
  }, [analysisText, lineComments, analysisTab])

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
          setSavedAnalysisId(id)
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
    explanationDepth,
    viewingAnalysisId
  ])

  const streamIdRef = useRef<string | null>(null)
  const analysisRef = useRef<HTMLDivElement>(null)
  const analysisPanelRef = useRef<ImperativePanelHandle>(null)
  const [analysisAnimating, setAnalysisAnimating] = useState(false)

  const expandAnalysisPanel = useCallback(() => {
    const p = analysisPanelRef.current
    if (!p) return
    if (p.getSize() < 5) {
      setAnalysisAnimating(true)
      p.resize(40)
      window.setTimeout(() => setAnalysisAnimating(false), 320)
    }
  }, [])

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
      track('ai_analyze_clicked', { provider: providerDefault, seniority, depth: explanationDepth })
      if (streamIdRef.current) {
        await window.api.invoke('providers:abort', { streamId: streamIdRef.current })
      }
      const streamId = `diff-${Date.now()}`
      streamIdRef.current = streamId
      setAnalysisText('')
      setAnalysisState('loading')
      setSavedAnalysisId(null)
      setError('')
      const prompt = buildDiffPrompt(
        diffText,
        seniority as SeniorityLevel,
        explanationDepth,
        explanationPersona,
        socraticMode
      )
      await window.api.invoke('providers:invoke', {
        id: providerDefault as 'claude' | 'codex' | 'gemini' | 'aider' | 'ollama',
        prompt,
        streamId
      })
    },
    [providerDefault, seniority, explanationDepth, explanationPersona, socraticMode]
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
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey && !e.altKey) {
        const sel = window.getSelection()?.toString().trim() ?? ''
        if (sel.length >= 2) {
          e.preventDefault()
          setCheatSheet({ open: true, selection: sel })
        }
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
      else if (a === 'view-branch-on-github' && remoteWebUrl && repoStatus?.branch)
        window.api.invoke('repository:openUrl', {
          url: `${remoteWebUrl}/tree/${repoStatus.branch}`
        })
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
    if (explanationDepthSaved != null) {
      setExplanationDepth(explanationDepthSaved as ExplanationDepth)
    }
  }, [explanationDepthSaved])

  useEffect(() => {
    if (explanationPersonaSaved) {
      setExplanationPersona(explanationPersonaSaved as PersonaId)
    }
  }, [explanationPersonaSaved])

  useEffect(() => {
    if (socraticModeSaved !== undefined) setSocraticMode(Boolean(socraticModeSaved))
  }, [socraticModeSaved])

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

  async function copyText(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* noop */
    }
  }

  function buildFileMenu(file: { path: string; status: string }): ContextMenuItem[] {
    return [
      {
        type: 'item',
        label: 'Abrir no editor',
        primary: true,
        onClick: () => window.api.invoke('repository:openInEditor', { path, file: file.path })
      },
      {
        type: 'item',
        label: 'Mostrar no Finder',
        onClick: () => window.api.invoke('repository:openInFinder', { path, file: file.path })
      },
      {
        type: 'item',
        label: 'Abrir com app padrão',
        onClick: () => window.api.invoke('repository:openFile', { path, file: file.path })
      },
      { type: 'separator' },
      {
        type: 'item',
        label: 'Copiar caminho relativo',
        onClick: () => copyText(file.path)
      },
      {
        type: 'item',
        label: 'Copiar caminho absoluto',
        onClick: () => copyText(`${path}/${file.path}`)
      }
    ]
  }

  function handleDepthChange(next: ExplanationDepth): void {
    setExplanationDepth(next)
  }

  function handlePersonaChange(next: PersonaId): void {
    setExplanationPersona(next)
  }

  function startAnalysis(): void {
    if (!fullDiff || files.length === 0 || !settingsReady) return
    expandAnalysisPanel()
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
        <div
          className="flex items-center gap-1 pl-20 pr-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Tooltip label="Voltar pra Home" shortcut="⌘H">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Home className="size-3.5" />
            </button>
          </Tooltip>
        </div>
        <div className="flex-1" aria-hidden />
        <div
          className="flex items-center gap-1.5 px-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <DiffModeDropdown mode={diffMode} onChange={changeDiffMode} />

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
                  </>
                )}
              </div>,
              document.body
            )}
          </div>

          <Tooltip
            label={
              !canAnalyze
                ? 'Sem alterações pra explicar — edita um arquivo primeiro'
                : analysisState === 'done'
                  ? 'Pedir nova explicação · IA reanalisa o diff atual'
                  : 'Pedir explicação · IA vai te ensinar o que mudou e por quê'
            }
          >
            <button
              onClick={startAnalysis}
              disabled={!canAnalyze}
              className={cn(
                'flex items-center gap-1.5 text-xs rounded-md px-3 h-7 font-semibold transition-all relative',
                canAnalyze
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
                  : 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed',
                canAnalyze && analysisState === 'idle' && 'ds-cta-breathe ds-cta-sheen-wrap'
              )}
            >
              <Sparkles
                className={cn(
                  'size-3.5 relative',
                  canAnalyze && analysisState === 'idle' && 'ds-icon-drift'
                )}
              />
              <span className="relative">
                {analysisState === 'done' ? 'Explicar de novo' : 'Explicar'}
              </span>
            </button>
          </Tooltip>

          <DepthSlider onChange={handleDepthChange} />
          <PersonaPicker onChange={handlePersonaChange} />

          <Tooltip
            label={
              socraticMode
                ? 'Modo Socrático ativo · IA pergunta antes de responder'
                : 'Ativar modo Socrático · IA te ensina perguntando'
            }
          >
            <button
              type="button"
              onClick={() => {
                const next = !socraticMode
                setSocraticMode(next)
                void window.api.invoke('settings:set', { key: 'socratic_mode', value: next })
              }}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-md border transition-colors',
                socraticMode
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border/40 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <MessageCircleQuestion className="size-3.5" />
            </button>
          </Tooltip>

          <Tooltip label="What if? · comparar com abordagem alternativa">
            <button
              type="button"
              onClick={() => setWhatIfOpen(true)}
              disabled={!fullDiff || files.length === 0}
              className="flex items-center justify-center w-7 h-7 rounded-md border border-border/40 bg-muted/40 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lightbulb className="size-3.5" />
            </button>
          </Tooltip>

          <Tooltip label="Caça ao bug · IA injeta erro pra você achar">
            <button
              type="button"
              onClick={() => {
                if (!fullDiff) return
                const sel = window.getSelection()?.toString().trim() ?? ''
                setBugHunt({
                  open: true,
                  snippet: sel.length >= 30 ? sel : fullDiff.slice(0, 1500)
                })
              }}
              disabled={!fullDiff || files.length === 0}
              className="flex items-center justify-center w-7 h-7 rounded-md border border-border/40 bg-muted/40 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Bug className="size-3.5" />
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
              <div className="mt-auto pt-1 flex flex-col items-center gap-1">
                <div className="w-6 h-px bg-border/40 my-1" />
                <AccountMenu size={28} side="right" />
              </div>
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
                  onCreateRequest={() => {
                    /* desabilitado — modo somente-leitura */
                  }}
                />
              </div>
            )}
            <div className="mt-1.5 flex w-full rounded-md border border-border/60 bg-background/60 p-0.5 gap-0.5 h-7">
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('changes')
                  setViewingCommitHash(null)
                }}
                className={cn(
                  'flex-1 text-[11px] rounded-sm transition-colors',
                  sidebarTab === 'changes'
                    ? 'bg-primary/15 text-primary font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
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
                    ? 'bg-primary/15 text-primary font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
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
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setCtxMenu({
                          x: e.clientX,
                          y: e.clientY,
                          items: buildFileMenu({ path: f.path, status: f.status })
                        })
                      }}
                      onMouseEnter={() => {
                        if (getMediaKind(f.path)) {
                          if (f.status !== 'added') prefetchBlob(path, f.path, 'HEAD')
                          if (f.status !== 'deleted') prefetchBlob(path, f.path, null)
                        }
                      }}
                      onDoubleClick={() =>
                        window.api.invoke('repository:openInEditor', { path, file: f.path })
                      }
                      title={`${f.path} · duplo-clique edita · botão direito pra opções`}
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

          <ProfileMenu />
        </aside>
        </div>
        )}

        <PanelGroup
          direction="horizontal"
          className="flex-1 min-w-0"
        >
        <Panel defaultSize={60} minSize={30}>
        {/* DIFF */}
        <section className="h-full flex flex-col overflow-hidden border-r border-border/40 min-w-0">
          <div className="h-9 flex items-center px-4 border-b border-border/30 gap-2 flex-shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <FileCode className="size-3 text-muted-foreground/60" />
              Diff
            </span>
            {selectedFile ? (
              <span className="text-xs font-mono text-muted-foreground/50 truncate" title={selectedFile}>
                {selectedFile}
              </span>
            ) : (
              files.length > 0 && (
                <>
                <span className="text-[11px] text-muted-foreground/60">
                  {files.length} arquivo{files.length !== 1 ? 's' : ''} alterado{files.length !== 1 ? 's' : ''}
                </span>
                {fullDiff && <AuthorshipBadge diff={fullDiff} className="ml-1" />}
                </>
              )
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
              <NoChangesEmptyState path={path} />
            )}
            </>
            )}
          </div>
        </section>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border/30 hover:bg-primary/60 active:bg-primary transition-colors" />

        <Panel
          ref={analysisPanelRef}
          defaultSize={40}
          minSize={20}
          collapsible
          collapsedSize={0}
          id="analysis-panel"
          className={analysisAnimating ? 'ds-panel-animating' : undefined}
        >
        {/* ANALYSIS */}
        <section className="h-full flex flex-col overflow-hidden min-w-0">
          <div className="h-9 flex items-center px-4 border-b border-border/30 gap-3 flex-shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <Sparkles className="size-3 text-primary/70" />
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
            {analysisState === 'done' && (
              <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                <CheckCircle2 className="size-3" />
                pronto
              </span>
            )}
          </div>

          {analysisText && analysisState !== 'loading' && (
            <AnalysisTabsBar
              tab={analysisTab}
              setTab={setAnalysisTab}
              detailsCount={lineComments.length}
              conceptsCount={conceptsCount}
            />
          )}

          <div ref={analysisRef} className="flex-1 overflow-auto px-4 py-4 min-h-0">
            {error ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : analysisState === 'loading' ? (
              <AnalysisSkeleton />
            ) : analysisText ? (
              <>
                <AnalysisTabs tab={analysisTab} text={analysisText} lineComments={lineComments} />
                {analysisState === 'done' && (viewingAnalysisId ?? savedAnalysisId) != null && (
                  <div className="mt-5">
                    <Quiz analysisId={(viewingAnalysisId ?? savedAnalysisId) as number} />
                  </div>
                )}
              </>
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

      <CheatSheetDialog
        open={cheatSheet.open}
        onClose={() => setCheatSheet({ open: false, selection: '' })}
        selection={cheatSheet.selection}
      />

      <WhatIfDialog
        open={whatIfOpen}
        onClose={() => setWhatIfOpen(false)}
        diff={fullDiff}
      />

      <BugHuntDialog
        open={bugHunt.open}
        onClose={() => setBugHunt({ open: false, snippet: '' })}
        snippet={bugHunt.snippet}
      />

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
          expandAnalysisPanel()
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

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
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
  favorite: boolean
}

function RepoRow({
  entry,
  onPick,
  onToggleFav
}: {
  entry: RecentEntry
  onPick: () => void
  onToggleFav: () => void
}): React.ReactElement {
  return (
    <div
      className="w-full px-3 h-8 flex items-center gap-2 hover:bg-accent transition-colors group"
      title={entry.path}
    >
      <button
        type="button"
        onClick={onPick}
        className="flex-1 min-w-0 flex items-center gap-2 text-left"
      >
        <Folder className="size-3.5 text-muted-foreground/60 flex-shrink-0" />
        <span className="text-[12px] font-medium text-foreground truncate">{entry.name}</span>
        <span className="text-[10px] text-muted-foreground/50 font-mono truncate flex-1 min-w-0">
          {entry.path}
        </span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleFav()
        }}
        title={entry.favorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
        className={cn(
          'flex-shrink-0 size-6 rounded flex items-center justify-center transition-all',
          entry.favorite
            ? 'text-yellow-400 hover:text-yellow-300'
            : 'text-muted-foreground/30 hover:text-yellow-400 opacity-0 group-hover:opacity-100'
        )}
      >
        <Star className={cn('size-3.5', entry.favorite && 'fill-current')} />
      </button>
    </div>
  )
}

function ProjectSwitcher({
  currentName,
  currentPath,
  onSwitch
}: {
  currentName: string
  currentPath: string
  onSwitch: (path: string) => void
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
      if (ref.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function pickExisting(): Promise<void> {
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
  const favorites = filtered.filter((r) => r.favorite)
  const nonFavorites = filtered.filter((r) => !r.favorite)

  async function toggleFavorite(r: RecentEntry): Promise<void> {
    const next = !r.favorite
    setRecents((prev) =>
      prev
        .map((x) => (x.path === r.path ? { ...x, favorite: next } : x))
        .sort((a, b) => {
          if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
          return b.lastOpenedAt - a.lastOpenedAt
        })
    )
    await window.api.invoke('workspace:setFavorite', { path: r.path, favorite: next })
  }

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
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/40 min-w-0">
            <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2 h-7 rounded-md border border-border/50 bg-background/60">
              <Search className="size-3 text-muted-foreground/60 flex-shrink-0" />
              <input
                ref={inputRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar…"
                className="flex-1 min-w-0 bg-transparent text-[11px] focus:outline-none"
              />
            </div>
            <Tooltip label="Abrir outra pasta">
              <button
                type="button"
                onClick={pickExisting}
                className="inline-flex items-center justify-center size-7 rounded-md border border-border/50 bg-card/60 hover:bg-accent/60 flex-shrink-0"
              >
                <FolderPlus className="size-3.5" />
              </button>
            </Tooltip>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filtered.length > 0 ? (
              <>
                {favorites.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Favoritos ({favorites.length})
                    </div>
                    {favorites.map((r) => (
                      <RepoRow
                        key={r.path}
                        entry={r}
                        onPick={() => {
                          setOpen(false)
                          onSwitch(r.path)
                        }}
                        onToggleFav={() => toggleFavorite(r)}
                      />
                    ))}
                  </>
                )}
                {nonFavorites.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      Recentes ({nonFavorites.length})
                    </div>
                    {nonFavorites.map((r) => (
                      <RepoRow
                        key={r.path}
                        entry={r}
                        onPick={() => {
                          setOpen(false)
                          onSwitch(r.path)
                        }}
                        onToggleFav={() => toggleFavorite(r)}
                      />
                    ))}
                  </>
                )}
              </>
            ) : (
              <p className="px-3 py-4 text-[11px] text-muted-foreground italic">
                {q ? 'Nada com esse filtro.' : 'Sem outros projetos abertos.'}
              </p>
            )}
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
    <div ref={ref} className="m-2 mt-1 rounded-xl border border-border/60 bg-background/70 shadow-sm p-1.5 relative">
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
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground h-full">
        <Loader2 className="size-3 animate-spin" /> carregando configurações...
      </div>
    )
  }
  if (!hasDiff) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Sparkles className="size-6 text-primary/60" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Sem alterações pra explicar</h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-5">
          Quando tu (ou tua IA) editar arquivos no projeto, eles vão aparecer aqui na sidebar.
          Aí é só clicar em <span className="font-semibold text-foreground">Explicar</span> que
          a IA quebra cada mudança pra ti.
        </p>
        <div className="flex flex-col gap-2 w-full text-[11px] text-muted-foreground/80">
          <Step n={1} label="Edita arquivos no editor (ou deixa Cursor/Copilot fazer)" />
          <Step n={2} label="Salva — eles aparecem na lista da esquerda" />
          <Step n={3} label='Clica em "Explicar" no topo' />
          <Step n={4} label="IA vai te ensinar o que mudou e por quê" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-md mx-auto">
      <div className="relative mb-5 ds-float w-20 h-20 flex items-center justify-center">
        {/* Conic glow background */}
        <span
          className="absolute inset-0 rounded-full opacity-40 blur-md ds-conic-spin"
          style={{
            background:
              'conic-gradient(from 0deg, color-mix(in srgb, var(--color-primary) 60%, transparent), transparent 35%, color-mix(in srgb, var(--color-primary) 40%, transparent) 65%, transparent)'
          }}
          aria-hidden
        />

        {/* Stacked halos */}
        <span className="absolute inset-2 rounded-2xl bg-primary/25 ds-halo" aria-hidden />
        <span className="absolute inset-2 rounded-2xl bg-primary/20 ds-halo-delay-1" aria-hidden />
        <span className="absolute inset-2 rounded-2xl bg-primary/15 ds-halo-delay-2" aria-hidden />

        {/* Icon container */}
        <div className="relative w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10 ds-inner-pulse">
          <Sparkles className="size-6 text-primary ds-icon-drift" />
        </div>

        {/* Orbiting dots */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="block size-1.5 rounded-full bg-primary/80 shadow-[0_0_6px_var(--color-primary)] ds-orbit-small" />
        </span>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="block size-1 rounded-full bg-primary/60 shadow-[0_0_4px_var(--color-primary)] ds-orbit-small-rev" />
        </span>

        {/* Twinkle stars */}
        <Sparkles className="absolute -top-1 -right-2 size-3 text-primary/80 ds-twinkle" aria-hidden />
        <Sparkles className="absolute -bottom-2 -left-1 size-2.5 text-primary/70 ds-twinkle-d-1" aria-hidden />
        <Sparkles className="absolute top-0 -left-3 size-2 text-primary/60 ds-twinkle-d-2" aria-hidden />

        {/* Sparkle dust */}
        <span className="ds-dust-1 absolute top-1 right-0 size-1 rounded-full bg-primary/80" aria-hidden />
        <span className="ds-dust-2 absolute -top-1 left-3 size-1 rounded-full bg-primary/70" aria-hidden />
        <span className="ds-dust-3 absolute bottom-0 -left-1 size-1 rounded-full bg-primary/80" aria-hidden />
        <span className="ds-dust-4 absolute -bottom-1 right-2 size-1 rounded-full bg-primary/60" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-2">Pronto pra te ensinar</h3>
      <p className="text-[12px] text-muted-foreground leading-relaxed mb-5">
        Vou ler o diff inteiro, identificar conceitos novos, marcar trechos com comentários
        inline e ajustar a profundidade pro teu nível.
      </p>
      <button
        onClick={onAnalyze}
        className="relative flex items-center gap-1.5 text-[13px] rounded-md px-4 h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ds-cta-breathe ds-cta-sheen-wrap"
      >
        <Sparkles className="size-3.5 ds-icon-drift relative" />
        <span className="relative">Explicar agora</span>
      </button>
      <p className="text-[10px] text-muted-foreground/50 mt-3">
        ou clica em <span className="font-mono text-muted-foreground/70">Explicar</span> no header
      </p>
    </div>
  )
}

function Step({ n, label }: { n: number; label: string }): React.ReactElement {
  return (
    <div className="flex items-start gap-2 text-left">
      <span className="size-4 rounded-full bg-primary/15 border border-primary/30 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <span>{label}</span>
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

function AnalysisSkeleton() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % ANALYSIS_MESSAGES.length),
      1700
    )
    return () => clearInterval(t)
  }, [])

  // Generate stars once
  const stars = useMemo(() => {
    const arr: Array<{ x: number; y: number; size: number; delay: number; bright: boolean }> = []
    for (let i = 0; i < 70; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 4,
        bright: i % 6 === 0
      })
    }
    return arr
  }, [])

  return (
    <div className="ds-galaxy-stage flex flex-col h-full select-none">
      {/* Cosmic backdrop fills the entire panel */}
      <div className="ds-galaxy-bg" aria-hidden>
        <div className="ds-galaxy-nebula ds-galaxy-nebula-1" />
        <div className="ds-galaxy-nebula ds-galaxy-nebula-2" />
        <div className="ds-galaxy-nebula ds-galaxy-nebula-3" />
        <div className="ds-galaxy-stars">
          {stars.map((s, i) => (
            <span
              key={i}
              className={cn('ds-galaxy-star', s.bright && 'ds-galaxy-star-bright')}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Center: galaxy core */}
      <div className="relative flex-1 min-h-[280px] flex items-center justify-center">
        <div className="ds-galaxy-core" aria-hidden>
          <div className="ds-galaxy-orbit ds-galaxy-orbit-1" />
          <div className="ds-galaxy-orbit ds-galaxy-orbit-2" />
          <div className="ds-galaxy-orbit ds-galaxy-orbit-3" />
          <div className="ds-galaxy-orbit ds-galaxy-orbit-4" />
          <span className="ds-galaxy-dot ds-galaxy-dot-1" />
          <span className="ds-galaxy-dot ds-galaxy-dot-2" />
          <span className="ds-galaxy-dot ds-galaxy-dot-3" />
          <span className="ds-galaxy-dot ds-galaxy-dot-4" />
          <div className="ds-galaxy-pulse" />
          <div className="ds-galaxy-center">
            <Sparkles className="size-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Bottom panel: status + token stream + bars */}
      <div className="relative px-4 pt-2 pb-6 z-[1]">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span
            key={idx}
            className="ds-fade-up text-[12px] font-mono tracking-tight text-foreground/90"
          >
            {ANALYSIS_MESSAGES[idx]}
          </span>
        </div>

        <div className="mx-auto max-w-[340px] overflow-hidden rounded-md border border-border/30 bg-background/40 backdrop-blur-sm px-2 py-1.5 font-mono text-[10px] text-primary/70 ds-token-stream">
          <span className="ds-token-row">
            0x7f3 → embed → softmax → attn → mlp → norm → logit → emit
            0x7f3 → embed → softmax → attn → mlp → norm → logit → emit
          </span>
        </div>

        <div className="mx-auto max-w-[340px] mt-3 space-y-2">
          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div className="h-full w-full ds-shimmer" />
          </div>
          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden w-5/6">
            <div className="h-full w-full ds-shimmer" style={{ animationDelay: '0.25s' }} />
          </div>
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

  // Per-file added content for complexity detection
  const addedByFile = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of sections) {
      if (s.kind === 'line' && s.type === 'add') {
        const prev = map.get(s.file) ?? ''
        map.set(s.file, prev + s.content + '\n')
      }
    }
    return map
  }, [sections])

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
              <ComplexityBadge snippet={addedByFile.get(s.path) ?? ''} className="ml-1" />
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

type AnalysisTab = 'summary' | 'details' | 'concepts'

function useAnalysisData(text: string, lineComments: LineComment[]) {
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
  return { summary, details, concepts }
}

function AnalysisTabsBar({
  tab,
  setTab,
  detailsCount,
  conceptsCount
}: {
  tab: AnalysisTab
  setTab: (t: AnalysisTab) => void
  detailsCount: number
  conceptsCount: number
}) {
  const TABS: { id: AnalysisTab; label: string; count?: number }[] = [
    { id: 'summary', label: 'Resumo' },
    { id: 'details', label: 'Detalhes', count: detailsCount || undefined },
    { id: 'concepts', label: 'Conceitos', count: conceptsCount || undefined }
  ]
  return (
    <div className="flex gap-0.5 px-3 py-1.5 border-b border-border/30 bg-background/95 backdrop-blur-sm flex-shrink-0">
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
  )
}

function AnalysisTabs({
  tab,
  text,
  lineComments
}: {
  tab: AnalysisTab
  text: string
  lineComments: LineComment[]
}) {
  const { summary, concepts } = useAnalysisData(text, lineComments)

  return (
    <div>
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
      {tab === 'concepts' && <ConceptsTabBody concepts={concepts} />}
    </div>
  )
}

function ConceptsTabBody({
  concepts
}: {
  concepts: { code?: string; text: string; refs: number[] }[]
}) {
  const names = useMemo(
    () => concepts.map((c) => c.code).filter((s): s is string => !!s),
    [concepts]
  )
  const masteryMap = useConceptMastery(names)

  if (concepts.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Nenhum conceito identificado nessa explicação.
      </p>
    )
  }

  return (
    <ul className="space-y-2.5">
      {concepts.map((c, i) => {
        const mastery = c.code ? masteryMap[c.code] : null
        return (
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
              {mastery && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
                  <MasteryDots level={mastery.level} />
                  <span className="tabular-nums">
                    {mastery.correct}/{mastery.correct + mastery.wrong}
                  </span>
                </span>
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
        )
      })}
    </ul>
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
