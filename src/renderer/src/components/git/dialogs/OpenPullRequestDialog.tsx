import { useEffect, useMemo, useRef, useState } from 'react'
import {
  GitPullRequest,
  X,
  Loader2,
  Plus,
  Minus,
  ChevronDown,
  Check,
  Search,
  AlertTriangle
} from 'lucide-react'
import { Highlight } from 'prism-react-renderer'
import { cn } from '@/lib/utils'
import { useCodeTheme } from '@/hooks/useCodeTheme'
import type { CommitInfo, DiffFile } from '@shared/git'

interface Props {
  path: string
  branches: string[]
  defaultBranch: string | null
  currentBranch: string
  webUrl: string | null
  open: boolean
  onClose: () => void
}

interface Preview {
  commitCount: number
  additions: number
  deletions: number
  files: DiffFile[]
  commits: CommitInfo[]
}

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx', mjs: 'javascript',
  cjs: 'javascript', json: 'json', md: 'markdown', mdx: 'markdown',
  css: 'css', scss: 'scss', less: 'css', html: 'markup', htm: 'markup',
  xml: 'markup', svg: 'markup', vue: 'markup', py: 'python', rb: 'ruby',
  go: 'go', rs: 'rust', java: 'java', kt: 'kotlin', php: 'php',
  cs: 'csharp', cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp', swift: 'swift',
  yml: 'yaml', yaml: 'yaml', toml: 'toml', sh: 'bash', bash: 'bash',
  zsh: 'bash', sql: 'sql', graphql: 'graphql', gql: 'graphql'
}

function detectLanguage(file: string): string {
  const ext = file.split('.').pop()?.toLowerCase() ?? ''
  if (file.toLowerCase().includes('dockerfile')) return 'docker'
  return EXT_TO_LANG[ext] ?? 'tsx'
}

function BranchSelect({
  base,
  branches,
  currentBranch,
  defaultBranch,
  onChange
}: {
  base: string
  branches: string[]
  currentBranch: string
  defaultBranch: string | null
  onChange: (b: string) => void
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = useMemo(() => {
    const list = branches.filter((b) => b !== currentBranch)
    const q = filter.toLowerCase()
    return q ? list.filter((b) => b.toLowerCase().includes(q)) : list
  }, [branches, filter, currentBranch])

  const def = filtered.includes(defaultBranch ?? '') ? defaultBranch : null
  const others = filtered.filter((b) => b !== def)

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[12px] font-mono hover:bg-accent/60"
      >
        <span className="text-muted-foreground">base:</span>
        <span className="font-semibold text-foreground">{base}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 rounded-md border border-border bg-popover shadow-2xl z-[400] overflow-hidden">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/40">
            <Search className="size-3 text-muted-foreground" />
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar branches…"
              className="flex-1 bg-transparent text-[11px] focus:outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {def && (
              <>
                <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/60">
                  Branch padrão
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChange(def)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1 text-[11px] text-left',
                    base === def ? 'bg-primary/10' : 'hover:bg-accent/60'
                  )}
                >
                  {base === def ? (
                    <Check className="size-3 text-primary flex-shrink-0" />
                  ) : (
                    <span className="size-3 flex-shrink-0" />
                  )}
                  <span className="font-mono truncate">{def}</span>
                </button>
              </>
            )}
            {others.length > 0 && (
              <>
                {def && (
                  <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/60 mt-1">
                    Branches
                  </div>
                )}
                {others.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      onChange(b)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1 text-[11px] text-left',
                      base === b ? 'bg-primary/10' : 'hover:bg-accent/60'
                    )}
                  >
                    {base === b ? (
                      <Check className="size-3 text-primary flex-shrink-0" />
                    ) : (
                      <span className="size-3 flex-shrink-0" />
                    )}
                    <span className="font-mono truncate">{b}</span>
                  </button>
                ))}
              </>
            )}
            {filtered.length === 0 && (
              <p className="p-3 text-[11px] text-muted-foreground italic">Nenhuma branch.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface ParsedLine {
  type: 'add' | 'del' | 'ctx' | 'hunk'
  text: string
  oldNum: number | null
  newNum: number | null
}

function parseFileDiff(diff: string): ParsedLine[] {
  const result: ParsedLine[] = []
  let oldCur = 0
  let newCur = 0
  let inHunk = false
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ') || line.startsWith('new file') || line.startsWith('deleted file') || line.startsWith('rename ') || line.startsWith('similarity ') || line.startsWith('mode ')) continue
    if (line.startsWith('@@')) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (m) {
        oldCur = parseInt(m[1], 10)
        newCur = parseInt(m[2], 10)
      }
      result.push({ type: 'hunk', text: line, oldNum: null, newNum: null })
      inHunk = true
      continue
    }
    if (!inHunk) continue
    if (line.startsWith('+')) {
      result.push({ type: 'add', text: line.slice(1), oldNum: null, newNum: newCur })
      newCur++
    } else if (line.startsWith('-')) {
      result.push({ type: 'del', text: line.slice(1), oldNum: oldCur, newNum: null })
      oldCur++
    } else if (line.startsWith(' ') || line === '') {
      result.push({
        type: 'ctx',
        text: line.length > 0 ? line.slice(1) : '',
        oldNum: oldCur,
        newNum: newCur
      })
      oldCur++
      newCur++
    } else if (line.startsWith('\\')) {
      // no newline at end of file
      continue
    }
  }
  return result
}

function FileDiff({ diff, file }: { diff: string; file: string }): React.ReactElement {
  const { variant } = useCodeTheme()
  const language = detectLanguage(file)
  const lines = useMemo(() => parseFileDiff(diff), [diff])

  if (lines.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground">
        Sem alterações nesse arquivo.
      </div>
    )
  }

  return (
    <div className="text-[11px] font-mono leading-5">
      {lines.map((l, i) => {
        if (l.type === 'hunk') {
          return (
            <div key={i} className="px-3 py-1 bg-muted/30 text-muted-foreground/70 border-y border-border/30">
              {l.text}
            </div>
          )
        }
        const isAdd = l.type === 'add'
        const isDel = l.type === 'del'
        return (
          <div
            key={i}
            className={cn(
              'flex',
              isAdd && 'bg-green-500/8',
              isDel && 'bg-red-500/8'
            )}
          >
            <div className="w-10 text-right pr-1 text-[10px] text-muted-foreground/40 select-none flex-shrink-0">
              {l.oldNum ?? ''}
            </div>
            <div className="w-10 text-right pr-1 text-[10px] text-muted-foreground/40 select-none flex-shrink-0">
              {l.newNum ?? ''}
            </div>
            <div
              className={cn(
                'w-5 text-center select-none flex-shrink-0',
                isAdd ? 'text-green-500/70' : isDel ? 'text-red-500/70' : 'text-transparent'
              )}
            >
              {isAdd ? '+' : isDel ? '-' : ' '}
            </div>
            <div className={cn('flex-1 min-w-0 pr-3 whitespace-pre-wrap break-all', isDel && 'opacity-80')}>
              {l.text ? (
                <Highlight code={l.text} language={language} theme={variant.prism}>
                  {({ tokens, getTokenProps }) => (
                    <>
                      {tokens[0]?.map((token, k) => (
                        <span key={k} {...getTokenProps({ token })} />
                      ))}
                    </>
                  )}
                </Highlight>
              ) : (
                '\u00A0'
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function OpenPullRequestDialog({
  path,
  branches,
  defaultBranch,
  currentBranch,
  webUrl,
  open,
  onClose
}: Props): React.ReactElement | null {
  const [base, setBase] = useState<string>('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileDiff, setFileDiff] = useState<string>('')
  const [diffLoading, setDiffLoading] = useState(false)
  const [merge, setMerge] = useState<{ canMerge: boolean; reason: string | null } | null>(null)

  useEffect(() => {
    if (!open) return
    const initial =
      defaultBranch && branches.includes(defaultBranch) && defaultBranch !== currentBranch
        ? defaultBranch
        : branches.find((b) => b !== currentBranch) ?? ''
    setBase(initial)
    setError('')
    setSelectedFile(null)
    setFileDiff('')
    setMerge(null)
  }, [open, defaultBranch, branches, currentBranch])

  useEffect(() => {
    if (!open || !base || !currentBranch) return
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      window.api.invoke('git:prPreview', { path, base, head: currentBranch }),
      window.api.invoke('git:canMerge', { path, base, head: currentBranch })
    ])
      .then(([p, m]) => {
        if (cancelled) return
        setPreview(p)
        setMerge(m)
        if (p.files.length > 0) setSelectedFile(p.files[0].path)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(String(e))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, base, currentBranch, path])

  useEffect(() => {
    if (!open || !selectedFile || !base || !currentBranch) return
    let cancelled = false
    setDiffLoading(true)
    window.api
      .invoke('git:diffRange', { path, base, head: currentBranch, file: selectedFile })
      .then((r) => {
        if (cancelled) return
        setFileDiff(r.diff)
        setDiffLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setDiffLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, selectedFile, base, currentBranch, path])

  if (!open) return null

  function createPR(): void {
    if (!webUrl || !base || !currentBranch) return
    window.api.invoke('repository:openUrl', {
      url: `${webUrl}/compare/${base}...${currentBranch}?expand=1`
    })
    onClose()
  }

  const noChanges = preview && preview.commitCount === 0
  const commitsWord = preview && preview.commitCount === 1 ? 'commit' : 'commits'

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[1100px] h-[80vh] max-w-[95vw] max-h-[90vh] rounded-xl border border-border bg-popover shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <GitPullRequest className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Abrir Pull Request</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
          <div className="text-[12px] text-foreground/85 flex items-center gap-1.5 flex-wrap">
            Mergear{' '}
            <span className="font-semibold">
              {preview?.commitCount ?? 0} {commitsWord}
            </span>{' '}
            em{' '}
            <BranchSelect
              base={base}
              branches={branches}
              currentBranch={currentBranch}
              defaultBranch={defaultBranch}
              onChange={setBase}
            />{' '}
            de{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-foreground">
              {currentBranch}
            </code>
            .
          </div>
          {preview && (
            <div className="text-[11px] tabular-nums flex items-center gap-2">
              <span className="text-green-500">+{preview.additions} linhas adicionadas</span>
              <span className="text-muted-foreground">,</span>
              <span className="text-red-500">-{preview.deletions} linhas removidas</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 flex">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-[12px] text-muted-foreground gap-2">
              <Loader2 className="size-3.5 animate-spin" />
              calculando diff…
            </div>
          ) : error ? (
            <div className="p-4 text-[11px] text-destructive whitespace-pre-wrap font-mono">
              {error}
            </div>
          ) : noChanges ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-8 py-12">
              <GitPullRequest className="size-8 text-muted-foreground/50 mb-3" />
              <h4 className="text-sm font-semibold text-foreground mb-1">Sem mudanças</h4>
              <p className="text-[11px] text-muted-foreground">
                <code className="bg-muted px-1 rounded font-mono">{base}</code> está atualizada com
                todos commits de{' '}
                <code className="bg-muted px-1 rounded font-mono">{currentBranch}</code>.
              </p>
            </div>
          ) : preview ? (
            <>
              <aside className="w-72 flex-shrink-0 border-r border-border/40 overflow-y-auto bg-muted/20">
                <div className="px-3 py-2 border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  Mostrando {preview.files.length} arquivo{preview.files.length === 1 ? '' : 's'}
                </div>
                <ul className="py-1">
                  {preview.files.map((f) => (
                    <li key={f.path}>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(f.path)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors',
                          selectedFile === f.path
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-accent/40 border-l-2 border-transparent'
                        )}
                      >
                        <span
                          className={cn(
                            'w-3 text-center text-[10px] font-mono flex-shrink-0',
                            f.status === 'added' && 'text-green-500',
                            f.status === 'deleted' && 'text-red-500',
                            f.status === 'renamed' && 'text-blue-500',
                            f.status === 'modified' && 'text-amber-500'
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
                        <span className="truncate text-[11px] font-mono flex-1 min-w-0">
                          {f.path}
                        </span>
                        <span className="text-green-500 text-[10px] inline-flex items-center gap-0.5">
                          <Plus className="size-2.5" />
                          {f.additions}
                        </span>
                        <span className="text-red-500 text-[10px] inline-flex items-center gap-0.5">
                          <Minus className="size-2.5" />
                          {f.deletions}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="px-3 py-2 border-t border-border/40 mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {preview.commitCount} {commitsWord}
                </div>
                <ul>
                  {preview.commits.slice(0, 30).map((c) => (
                    <li
                      key={c.hash}
                      className="px-3 py-1 text-[11px] flex items-center gap-2"
                    >
                      <code className="text-[9px] text-muted-foreground/70 font-mono flex-shrink-0">
                        {c.short}
                      </code>
                      <span className="truncate text-foreground/85">{c.message}</span>
                    </li>
                  ))}
                  {preview.commits.length > 30 && (
                    <li className="px-3 py-1 text-[10px] text-muted-foreground italic">
                      +{preview.commits.length - 30} ocultos
                    </li>
                  )}
                </ul>
              </aside>

              <div className="flex-1 min-w-0 overflow-auto bg-background">
                {selectedFile ? (
                  diffLoading ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground gap-2">
                      <Loader2 className="size-3 animate-spin" />
                      carregando diff…
                    </div>
                  ) : (
                    <div className="px-3 py-2 border-b border-border/30 text-[11px] text-muted-foreground sticky top-0 bg-background/90 backdrop-blur z-10">
                      <span className="font-mono text-foreground/80">{selectedFile}</span>
                    </div>
                  )
                ) : null}
                {!diffLoading && selectedFile && <FileDiff diff={fileDiff} file={selectedFile} />}
              </div>
            </>
          ) : null}
        </div>

        <div className="px-4 py-3 border-t border-border/40 flex-shrink-0 flex items-center justify-between gap-3">
          <div className="text-[11px]">
            {merge ? (
              merge.canMerge ? (
                <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <Check className="size-3.5" />
                  <span className="font-semibold">Mergeável.</span>
                  <span className="text-muted-foreground">
                    Essas branches podem ser mergeadas automaticamente.
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-3.5" />
                  <span className="font-semibold">Conflito previsto.</span>
                  <span className="text-muted-foreground">{merge.reason}</span>
                </span>
              )
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 text-[12px] rounded-md border border-border hover:bg-accent/60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={createPR}
              disabled={!webUrl || noChanges === true || loading}
              className="h-8 px-4 text-[12px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Criar Pull Request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
