import { useEffect, useRef, useState } from 'react'
import { GitCommit, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUMMARY_MAX = 72

interface Props {
  path: string
  branch: string
  stagedCount: number
  open: boolean
  onClose: () => void
  onCommitted: () => void
}

export default function CommitDialog({
  path,
  branch,
  stagedCount,
  open,
  onClose,
  onCommitted
}: Props): React.ReactElement | null {
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSummary('')
      setDescription('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  async function commit(): Promise<void> {
    if (!summary.trim() || busy) return
    setBusy(true)
    setError('')
    const r = await window.api.invoke('git:commit', {
      path,
      summary: summary.trim(),
      description: description.trim() || undefined
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.error ?? 'Falha ao commitar')
      return
    }
    onCommitted()
    onClose()
  }

  const remaining = SUMMARY_MAX - summary.length
  const canCommit = !busy && stagedCount > 0 && summary.trim().length > 0

  return (
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[480px] rounded-xl border border-border bg-popover shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <GitCommit className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">
              Commit em <span className="font-mono text-primary">{branch}</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {stagedCount === 0 && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md px-2 py-1.5 border border-amber-500/30">
              Nenhum arquivo staged. Vai commitar vazio — usa o switcher de arquivos pra marcar primeiro.
            </div>
          )}
          <input
            ref={inputRef}
            value={summary}
            onChange={(e) => setSummary(e.target.value.slice(0, SUMMARY_MAX))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                commit()
              }
            }}
            placeholder="Summary (obrigatório)"
            maxLength={SUMMARY_MAX}
            disabled={busy}
            className="w-full rounded-md border border-border/60 bg-background/80 px-2.5 py-2 text-[13px] focus:outline-none focus:border-primary/60"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={4}
            disabled={busy}
            className="w-full resize-none rounded-md border border-border/60 bg-background/80 px-2.5 py-2 text-[12px] focus:outline-none focus:border-primary/60"
          />
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              {stagedCount} arquivo{stagedCount === 1 ? '' : 's'} staged · ⌘+Enter pra commitar
            </span>
            <span
              className={cn(
                'tabular-nums',
                remaining < 10
                  ? remaining < 0
                    ? 'text-destructive'
                    : 'text-orange-500'
                  : 'text-muted-foreground/60'
              )}
            >
              {remaining}
            </span>
          </div>
          {error && (
            <div className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5 border border-destructive/30">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-8 px-3 text-[12px] rounded-md hover:bg-accent/60 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={commit}
            disabled={!canCommit}
            className="h-8 px-3 text-[12px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="size-3 animate-spin" />}
            Commit
          </button>
        </div>
      </div>
    </div>
  )
}
