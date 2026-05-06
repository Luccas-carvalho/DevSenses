import { useEffect, useMemo, useRef, useState } from 'react'
import { GitPullRequest, X, Loader2, Plus, Minus, ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
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
                  Default
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

  useEffect(() => {
    if (!open) return
    const initial =
      defaultBranch && branches.includes(defaultBranch) && defaultBranch !== currentBranch
        ? defaultBranch
        : branches.find((b) => b !== currentBranch) ?? ''
    setBase(initial)
    setError('')
  }, [open, defaultBranch, branches, currentBranch])

  useEffect(() => {
    if (!open || !base || !currentBranch) return
    let cancelled = false
    setLoading(true)
    setError('')
    window.api
      .invoke('git:prPreview', { path, base, head: currentBranch })
      .then((r) => {
        if (cancelled) return
        setPreview(r)
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
      <div className="w-[640px] max-h-[80vh] rounded-xl border border-border bg-popover shadow-2xl flex flex-col">
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
              <span className="text-green-500">+{preview.additions} added lines</span>
              <span className="text-muted-foreground">,</span>
              <span className="text-red-500">-{preview.deletions} removed lines</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-[280px]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-[12px] text-muted-foreground gap-2">
              <Loader2 className="size-3.5 animate-spin" />
              calculando diff…
            </div>
          ) : error ? (
            <div className="p-4 text-[11px] text-destructive whitespace-pre-wrap font-mono">
              {error}
            </div>
          ) : noChanges ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-12">
              <GitPullRequest className="size-8 text-muted-foreground/50 mb-3" />
              <h4 className="text-sm font-semibold text-foreground mb-1">Sem mudanças</h4>
              <p className="text-[11px] text-muted-foreground">
                <code className="bg-muted px-1 rounded font-mono">{base}</code> está atualizada com
                todos os commits de{' '}
                <code className="bg-muted px-1 rounded font-mono">{currentBranch}</code>.
              </p>
            </div>
          ) : preview ? (
            <div className="px-4 py-3 space-y-3">
              <section>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  {preview.commitCount} {commitsWord}
                </h4>
                <ul className="rounded-md border border-border/40 bg-card/40 divide-y divide-border/30">
                  {preview.commits.slice(0, 30).map((c) => (
                    <li key={c.hash} className="px-3 py-1.5 flex items-center gap-2 text-[11px]">
                      <code className="text-[10px] text-muted-foreground/70 font-mono">
                        {c.short}
                      </code>
                      <span className="text-foreground/85 truncate flex-1">{c.message}</span>
                      <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px]">
                        {c.author}
                      </span>
                    </li>
                  ))}
                  {preview.commits.length > 30 && (
                    <li className="px-3 py-1.5 text-[10px] text-muted-foreground italic">
                      +{preview.commits.length - 30} commits ocultos
                    </li>
                  )}
                </ul>
              </section>

              <section>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  {preview.files.length} arquivo{preview.files.length === 1 ? '' : 's'}
                </h4>
                <ul className="rounded-md border border-border/40 bg-card/40 divide-y divide-border/30">
                  {preview.files.map((f) => (
                    <li key={f.path} className="px-3 py-1.5 flex items-center gap-2 text-[11px]">
                      <span
                        className={cn(
                          'w-3 text-center font-mono text-[10px] flex-shrink-0',
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
                      <span className="font-mono truncate flex-1">{f.path}</span>
                      <span className="text-green-500 inline-flex items-center gap-0.5 text-[10px]">
                        <Plus className="size-2.5" />
                        {f.additions}
                      </span>
                      <span className="text-red-500 inline-flex items-center gap-0.5 text-[10px]">
                        <Minus className="size-2.5" />
                        {f.deletions}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/40 flex-shrink-0">
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
  )
}
