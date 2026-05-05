import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  Layers,
  Pencil,
  ChevronDown,
  Folder,
  FolderPlus,
  History,
  X,
  Trash2,
  FlaskConical
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import { buildDiffPrompt } from '@/lib/diffPrompt'
import type { DiffFile } from '@shared/git'
import type { SeniorityLevel } from '@shared/seniority'
import type { ThemeMode, DiffMode } from '@shared/settings'
import { cn } from '@/lib/utils'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

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

  const lineComments = useMemo(() => parseLineComments(analysisText), [analysisText])

  // Persist concepts + save analysis to history when analysis finishes
  const persistedAnalysisRef = useRef<string>('')
  const [historyVersion, setHistoryVersion] = useState(0)
  useEffect(() => {
    if (analysisState !== 'done') return
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
    professorTurbo
  ])

  const streamIdRef = useRef<string | null>(null)
  const analysisRef = useRef<HTMLDivElement>(null)
  const selectedFileRef = useRef<string | null>(null)
  const fetchInFlightRef = useRef(false)
  const fetchPendingRef = useRef(false)
  selectedFileRef.current = selectedFile

  const runAnalysis = useCallback(
    async (diffText: string) => {
      if (!providerDefault || !seniority || !diffText) return
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

  // File watcher: re-fetch on save (NÃO dispara análise — botão manual)
  useEffect(() => {
    if (!path) return
    window.api.invoke('workspace:watch', { path })
    const off = window.api.on('workspace:changed', () => {
      fetchProject()
    })
    return () => {
      off()
      window.api.invoke('workspace:unwatch', undefined)
    }
  }, [path, fetchProject])

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
          <DiffModeToggle mode={diffMode} onChange={changeDiffMode} />

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
            {analysisState === 'done' ? 'Reanalisar' : 'Analisar'}
          </button>

          <button
            onClick={toggleTurbo}
            title={professorTurbo ? 'Modo Professor Turbo ativo' : 'Ativar modo Professor Turbo'}
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

          <button
            onClick={() => navigate('/tests')}
            title="Testes IA"
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <FlaskConical className="size-3.5" />
          </button>

          <button
            onClick={() => setHistoryOpen(true)}
            title="Histórico de análises"
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <History className="size-3.5" />
          </button>

          <button
            onClick={() => fetchProject()}
            title="Recarregar diff"
            disabled={diffLoading}
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn('size-3.5', diffLoading && 'animate-spin')} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* SIDEBAR — floating, padding around, rounded corners */}
        <div className="pl-2 pr-1 py-2 flex-shrink-0">
        <aside className="w-[252px] h-full flex flex-col overflow-hidden bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl border border-border/30 shadow-sm">
          {/* Sidebar header */}
          <div className="px-2 pt-2 pb-3 border-b border-border/30">
            <ProjectSwitcher
              currentName={repoName}
              currentPath={path}
              onSwitch={(p) =>
                navigate(`/project?path=${encodeURIComponent(p)}`)
              }
            />
            {branch && (
              <div className="px-2 mt-1.5">
                <BranchDropdown
                  current={branch}
                  branches={branches}
                  busy={checkingOut}
                  onChange={switchBranch}
                />
              </div>
            )}
            {!diffLoading && (
              <div className="mt-2.5 flex items-center justify-between gap-2 px-2">
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

          {/* File list */}
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
                    'w-full text-left px-3 py-2 flex items-center gap-2 text-xs transition-colors border-b border-border/30',
                    selectedFile === null
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent/60 text-muted-foreground'
                  )}
                >
                  <FileCode className="size-3 flex-shrink-0" />
                  <span className="font-medium">Todos</span>
                </button>
                {files.map((f) => {
                  const { name, dir } = splitPath(f.path)
                  return (
                    <button
                      key={f.path}
                      onClick={() => selectFile(f.path)}
                      title={f.path}
                      className={cn(
                        'w-full text-left px-3 py-2 flex items-start gap-2 text-xs transition-colors border-b border-border/20 last:border-0',
                        selectedFile === f.path ? 'bg-primary/10' : 'hover:bg-accent/50'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 w-3 text-[10px] font-bold flex-shrink-0',
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
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'truncate',
                            selectedFile === f.path ? 'text-primary font-medium' : 'text-foreground/85'
                          )}
                        >
                          {name}
                        </div>
                        {dir && (
                          <div className="text-[10px] text-muted-foreground/40 truncate font-mono">
                            {dir}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {f.additions > 0 && (
                            <span className="text-green-500 text-[10px] flex items-center gap-0.5">
                              <Plus className="size-2" />
                              {f.additions}
                            </span>
                          )}
                          {f.deletions > 0 && (
                            <span className="text-red-400 text-[10px] flex items-center gap-0.5">
                              <Minus className="size-2" />
                              {f.deletions}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </>
            )}
          </div>

          <ProfileMenu />
        </aside>
        </div>

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
            {diffLoading ? (
              <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> carregando diff...
              </div>
            ) : diff ? (
              <>
                <DiffViewer
                  diff={diff}
                  hideFileHeaders={selectedFile !== null}
                  comments={lineComments}
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
          </div>
        </section>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border/30 hover:bg-primary/60 active:bg-primary transition-colors" />

        <Panel defaultSize={40} minSize={20}>
        {/* ANALYSIS */}
        <section className="h-full flex flex-col overflow-hidden min-w-0">
          <div className="h-9 flex items-center px-4 border-b border-border/30 gap-3 flex-shrink-0">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Análise IA
            </span>
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
          setViewingAnalysisId(record.id)
          setHistoryOpen(false)
          setAnalysisText(record.analysis)
          setFullDiff(record.diff)
          setDiff(record.diff)
          setSelectedFile(null)
          setAnalysisState('done')
        }}
        onExitView={() => {
          setViewingAnalysisId(null)
          fetchProject()
          setAnalysisText('')
          setAnalysisState('idle')
        }}
      />

      {viewingAnalysisId !== null && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs shadow-xl">
          <History className="size-3" />
          Visualizando análise antiga
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
    </div>
  )
}

const DIFF_MODE_OPTIONS: { value: DiffMode; label: string; icon: typeof Layers; tip: string }[] = [
  { value: 'all', label: 'Tudo', icon: Layers, tip: 'Commits recentes + não commitado' },
  { value: 'uncommitted', label: 'Pendente', icon: Pencil, tip: 'Apenas alterações não commitadas' },
  { value: 'committed', label: 'Commits', icon: GitCommit, tip: 'Apenas commits recentes' }
]

function DiffModeToggle({
  mode,
  onChange
}: {
  mode: DiffMode
  onChange: (mode: DiffMode) => void
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border/40 bg-muted/40 p-0.5">
      {DIFF_MODE_OPTIONS.map(({ value, label, icon: Icon, tip }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          title={tip}
          className={cn(
            'flex items-center gap-1 px-2 h-6 rounded text-[11px] font-medium transition-colors',
            mode === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="size-3" />
          {label}
        </button>
      ))}
    </div>
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
  onSwitch
}: {
  currentName: string
  currentPath: string
  onSwitch: (path: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [recents, setRecents] = useState<RecentEntry[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-2 p-2 rounded-lg transition-colors',
          open ? 'bg-primary/10' : 'hover:bg-accent/60'
        )}
      >
        <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <FileCode className="size-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-semibold text-sm truncate">{currentName}</div>
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-muted-foreground/60 flex-shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
          {others.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 border-b border-border/30">
                Recentes
              </div>
              {others.map((r) => (
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
          )}
          <button
            type="button"
            onClick={pickFolder}
            className={cn(
              'w-full px-3 py-2.5 flex items-center gap-2 text-xs hover:bg-accent transition-colors text-left',
              others.length > 0 && 'border-t border-border/40'
            )}
          >
            <FolderPlus className="size-3.5 text-muted-foreground" />
            Abrir outro projeto
          </button>
        </div>
      )}
    </div>
  )
}

function BranchDropdown({
  current,
  branches,
  busy,
  onChange
}: {
  current: string
  branches: string[]
  busy: boolean
  onChange: (b: string) => void
}) {
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

  const hasOthers = branches.length > 1

  return (
    <div ref={ref} className="relative mt-0.5">
      <button
        type="button"
        onClick={() => hasOthers && !busy && setOpen((o) => !o)}
        disabled={!hasOthers || busy}
        className={cn(
          'flex items-center gap-1 text-[11px] text-muted-foreground transition-colors max-w-full',
          hasOthers && !busy && 'hover:text-foreground cursor-pointer',
          (!hasOthers || busy) && 'cursor-default'
        )}
      >
        {busy ? (
          <Loader2 className="size-2.5 flex-shrink-0 animate-spin" />
        ) : (
          <GitBranch className="size-2.5 flex-shrink-0" />
        )}
        <span className="font-mono truncate">{current}</span>
        {hasOthers && !busy && (
          <ChevronDown
            className={cn(
              'size-2.5 flex-shrink-0 text-muted-foreground/50 transition-transform',
              open && 'rotate-180'
            )}
          />
        )}
      </button>
      {open && hasOthers && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[220px] rounded-md border border-border bg-popover shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 border-b border-border/30">
            Branches ({branches.length})
          </div>
          {branches.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => {
                setOpen(false)
                onChange(b)
              }}
              className={cn(
                'w-full px-3 py-2 text-xs text-left font-mono hover:bg-accent transition-colors flex items-center gap-2',
                b === current && 'bg-primary/10 text-primary'
              )}
            >
              {b === current ? (
                <span className="text-primary text-[10px]">●</span>
              ) : (
                <span className="text-muted-foreground/30 text-[10px]">○</span>
              )}
              <span className="truncate">{b}</span>
            </button>
          ))}
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
          Sem alterações pra analisar.
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-1">
          Edita um arquivo e clica em Analisar.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
        <Sparkles className="size-5 text-primary" />
      </div>
      <p className="text-xs text-foreground/80 mb-1">Pronto pra analisar.</p>
      <p className="text-[11px] text-muted-foreground/60 mb-4">
        Clica em Analisar quando quiser revisar.
      </p>
      <button
        onClick={onAnalyze}
        className="flex items-center gap-1.5 text-xs rounded-md px-3 h-7 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Sparkles className="size-3" />
        Analisar agora
      </button>
    </div>
  )
}

const ANALYSIS_MESSAGES = [
  'Lendo o diff...',
  'Conectando os pontos...',
  'Pensando em senioridade...',
  'Procurando bugs sutis...',
  'Aplicando boas práticas...',
  'Quase lá!'
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

  return (
    <div className="flex flex-col items-center justify-center py-12 select-none">
      {/* glow + orb central com sparkle girando */}
      <div className="relative w-28 h-28 mb-7">
        {/* halo difuso pulsante */}
        <div
          className="absolute inset-[-12px] rounded-full bg-primary/25 blur-2xl animate-pulse"
          style={{ animationDuration: '2.4s' }}
        />
        {/* anel gradiente */}
        <div
          className="absolute inset-2 rounded-full bg-gradient-to-br from-primary via-primary/70 to-primary/30 animate-pulse shadow-lg shadow-primary/30"
          style={{ animationDuration: '1.8s' }}
        />
        {/* sparkle central girando */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles
            className="size-9 text-primary-foreground drop-shadow-lg animate-spin"
            style={{ animationDuration: '3.2s' }}
          />
        </div>
        {/* partículas em órbita */}
        <div className="absolute top-1/2 left-1/2 -mt-1 -ml-1 w-2 h-2 rounded-full bg-primary shadow-md shadow-primary/50 ds-orbit" />
        <div className="absolute top-1/2 left-1/2 -mt-0.5 -ml-0.5 w-1.5 h-1.5 rounded-full bg-primary/70 ds-orbit-rev" />
      </div>

      {/* mensagem rotativa com fade */}
      <div
        key={idx}
        className="ds-fade-up text-sm font-medium text-foreground mb-3 text-center"
      >
        {ANALYSIS_MESSAGES[idx]}
      </div>

      {/* dots em sequência */}
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      {/* shimmer bars dando ideia de conteúdo chegando */}
      <div className="w-full max-w-[280px] space-y-2.5">
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div className="h-full w-full ds-shimmer" />
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden w-5/6">
          <div className="h-full w-full ds-shimmer" style={{ animationDelay: '0.2s' }} />
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden w-3/4">
          <div className="h-full w-full ds-shimmer" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}

const DiffViewer = React.memo(function DiffViewer({
  diff,
  hideFileHeaders = false,
  comments = []
}: {
  diff: string
  hideFileHeaders?: boolean
  comments?: LineComment[]
}) {
  const sections = useMemo(() => parseDiff(diff), [diff])
  const commentMap = useMemo(() => {
    const map = new Map<string, LineComment>()
    for (const c of comments) {
      map.set(`${c.file}:${c.line}`, c)
    }
    return map
  }, [comments])
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

        return (
          <React.Fragment key={i}>
            <div
              className={cn(
                'flex',
                isAdd && 'bg-green-500/8',
                isDel && 'bg-red-500/8',
                comment && 'border-l-2 border-primary/60'
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
                  isAdd ? 'text-green-300' : isDel ? 'text-red-300/80' : 'text-foreground/75'
                )}
              >
                {s.content || '\u00A0'}
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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left group"
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
                  <li key={idx} className="flex gap-1.5 text-foreground/80">
                    <span className="text-primary/60 mt-0.5">•</span>
                    <span>
                      {c.code && (
                        <code className="bg-muted px-1 rounded text-[11px] font-mono text-primary/80 mr-1">
                          {c.code}
                        </code>
                      )}
                      {renderInline(c.text)}
                    </span>
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
              Nenhum conceito identificado nessa análise.
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
          <h2 className="text-sm font-semibold">Histórico de análises</h2>
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
                Nenhuma análise salva{' '}
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
                  <button
                    type="button"
                    onClick={(e) => deleteItem(it.id, e)}
                    title="Apagar"
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}

function CollapsibleComment({ comment }: { comment: LineComment }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
          open ? 'bg-primary/8' : 'hover:bg-accent/40'
        )}
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
                  <li key={idx} className="flex gap-1.5 text-foreground/80 leading-relaxed">
                    <span className="text-primary/60 mt-0.5">•</span>
                    <span>
                      {c.code && (
                        <code className="bg-muted px-1 rounded text-[11px] font-mono text-primary/80 mr-1">
                          {c.code}
                        </code>
                      )}
                      {renderInline(c.text)}
                    </span>
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
