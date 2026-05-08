import { useEffect, useState } from 'react'
import { Loader2, GitCommit } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RepoStatus } from '@shared/git'

interface Props {
  path: string
  status: RepoStatus | null
  stagedCount: number
  onCommitted: () => void
}

const SUMMARY_MAX = 72

export default function CommitPanel({ path, status, stagedCount, onCommitted }: Props): React.ReactElement {
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
  }, [path])

  const branch = status?.branch ?? '...'
  const canCommit = !busy && stagedCount > 0 && summary.trim().length > 0

  async function commit(): Promise<void> {
    if (!canCommit) return
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
    setSummary('')
    setDescription('')
    onCommitted()
  }

  const summaryRemaining = SUMMARY_MAX - summary.length

  return (
    <div className="flex flex-col gap-2 p-3 border-t border-border/40 bg-card/30">
      <div className="flex flex-col gap-1.5">
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value.slice(0, SUMMARY_MAX))}
          placeholder="Summary (obrigatório)"
          maxLength={SUMMARY_MAX}
          disabled={busy}
          className="w-full rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={2}
          disabled={busy}
          className="w-full resize-none rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60"
        />
      </div>

      {error && (
        <div className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5 border border-destructive/30">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={commit}
          disabled={!canCommit}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-1.5 rounded-md h-8 text-[12px] font-medium transition-colors',
            canCommit
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <GitCommit className="size-3.5" />
          )}
          {busy
            ? 'Commitando…'
            : `Commit ${stagedCount > 0 ? `(${stagedCount}) ` : ''}em ${branch}`}
        </button>
        <span
          className={cn(
            'text-[10px] tabular-nums w-8 text-right',
            summaryRemaining < 10
              ? summaryRemaining < 0
                ? 'text-destructive'
                : 'text-orange-500'
              : 'text-muted-foreground/60'
          )}
        >
          {summaryRemaining}
        </span>
      </div>
    </div>
  )
}
