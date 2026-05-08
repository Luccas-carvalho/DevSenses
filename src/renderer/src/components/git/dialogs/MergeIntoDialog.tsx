import { useEffect, useMemo, useRef, useState } from 'react'
import { GitMerge, Loader2, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type Strategy = 'merge' | 'squash' | 'rebase'

interface Props {
  path: string
  branches: string[]
  currentBranch: string
  open: boolean
  defaultStrategy?: Strategy
  onClose: () => void
  onDone: () => void
}

export default function MergeIntoDialog({
  path,
  branches,
  currentBranch,
  open,
  defaultStrategy = 'merge',
  onClose,
  onDone
}: Props): React.ReactElement | null {
  const [filter, setFilter] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<Strategy>(defaultStrategy)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFilter('')
      setPicked(null)
      setStrategy(defaultStrategy)
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, defaultStrategy])

  const filtered = useMemo(() => {
    const list = branches.filter((b) => b !== currentBranch)
    const q = filter.toLowerCase()
    return q ? list.filter((b) => b.toLowerCase().includes(q)) : list
  }, [branches, filter, currentBranch])

  if (!open) return null

  async function submit(): Promise<void> {
    if (!picked || busy) return
    setBusy(true)
    setError('')
    const r = await window.api.invoke('git:mergeBranch', { path, from: picked, strategy })
    setBusy(false)
    if (!r.ok) {
      setError(
        (r.error ?? r.output ?? 'Falha').slice(0, 600) +
          (strategy === 'merge'
            ? '\n\nSe houver conflitos, edite os arquivos e use "git status" no terminal pra confirmar.'
            : '')
      )
      onDone()
      return
    }
    onDone()
    onClose()
  }

  const STRATEGIES: { id: Strategy; label: string; sub: string }[] = [
    { id: 'merge', label: 'Merge', sub: '--no-ff cria commit de merge' },
    { id: 'squash', label: 'Squash', sub: 'junta tudo num único commit' },
    { id: 'rebase', label: 'Rebase', sub: 'reaplica commits no topo' }
  ]

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[520px] rounded-xl border border-border bg-popover shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <GitMerge className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">
              Mergear na branch atual <span className="text-muted-foreground">({currentBranch})</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <span className="text-[11px] text-muted-foreground">De qual branch?</span>
            <div className="mt-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/60 bg-background/80">
              <Search className="size-3 text-muted-foreground" />
              <input
                ref={inputRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar branches…"
                className="flex-1 bg-transparent text-[12px] focus:outline-none"
              />
            </div>
            <div className="mt-1.5 max-h-44 overflow-y-auto rounded-md border border-border/40 bg-background/40">
              {filtered.length === 0 ? (
                <p className="p-3 text-[11px] text-muted-foreground italic">Nenhuma branch.</p>
              ) : (
                filtered.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setPicked(b)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-[12px] font-mono transition-colors',
                      picked === b
                        ? 'bg-primary/15 text-foreground'
                        : 'text-foreground/80 hover:bg-accent/60'
                    )}
                  >
                    {b}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground">Estratégia</span>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStrategy(s.id)}
                  className={cn(
                    'rounded-md border p-2 text-left transition-colors',
                    strategy === s.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/60 hover:bg-accent/40'
                  )}
                >
                  <div className="text-[12px] font-medium">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {s.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5 border border-destructive/30 max-h-40 overflow-auto whitespace-pre-wrap font-mono">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-7 px-3 text-[11px] rounded-md hover:bg-accent/60 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!picked || busy}
            className="h-7 px-3 text-[11px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="size-3 animate-spin" />}
            {strategy === 'merge'
              ? 'Mergear'
              : strategy === 'squash'
                ? 'Squash + Merge'
                : 'Rebase'}
          </button>
        </div>
      </div>
    </div>
  )
}
