import { useEffect, useRef, useState } from 'react'
import { Loader2, Undo2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import AccountMenu from '@/components/AccountMenu'

const SUMMARY_MAX = 72

interface Props {
  path: string
  branch: string
  pendingCount: number
  filesToStage: string[]
  onCommitted: () => void
}

export default function CommitArea({
  path,
  branch,
  pendingCount,
  filesToStage,
  onCommitted
}: Props): React.ReactElement {
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lastCommitted, setLastCommitted] = useState<{
    summary: string
    at: number
  } | null>(null)
  const [undoBusy, setUndoBusy] = useState(false)
  const [, setNowTick] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setError('')
    setLastCommitted(null)
  }, [path, branch])

  useEffect(() => {
    if (!lastCommitted) return
    const t = window.setInterval(() => setNowTick((n) => n + 1), 30_000)
    return () => window.clearInterval(t)
  }, [lastCommitted])

  async function commit(): Promise<void> {
    if (!summary.trim() || busy || pendingCount === 0) return
    setBusy(true)
    setError('')
    if (filesToStage.length > 0) {
      const stageR = await window.api.invoke('git:stageFiles', {
        path,
        files: filesToStage
      })
      if (!stageR.ok) {
        setBusy(false)
        setError(stageR.error ?? 'Falha ao stage arquivos')
        return
      }
    }
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
    const committedSummary = summary.trim()
    setSummary('')
    setDescription('')
    setLastCommitted({ summary: committedSummary, at: Date.now() })
    onCommitted()
  }

  async function undo(): Promise<void> {
    if (undoBusy) return
    setUndoBusy(true)
    setError('')
    const r = await window.api.invoke('git:undoLastCommit', { path })
    setUndoBusy(false)
    if (!r.ok) {
      setError(r.error ?? 'Falha ao desfazer commit')
      return
    }
    setLastCommitted(null)
    onCommitted()
  }

  function relativeTime(ts: number): string {
    const diffSec = Math.floor((Date.now() - ts) / 1000)
    if (diffSec < 5) return 'agora'
    if (diffSec < 60) return `há ${diffSec}s`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `há ${diffMin}m`
    const diffH = Math.floor(diffMin / 60)
    return `há ${diffH}h`
  }

  const remaining = SUMMARY_MAX - summary.length
  const canCommit = !busy && pendingCount > 0 && summary.trim().length > 0

  return (
    <div className="m-2 mt-1 rounded-xl border border-border/60 bg-background/70 shadow-sm p-2.5 flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <AccountMenu size={28} side="above" />
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
          disabled={busy}
          className="flex-1 rounded-md border border-border/70 bg-card px-2.5 h-7 text-[12px] focus:outline-none focus:border-primary/60 disabled:opacity-50"
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            commit()
          }
        }}
        placeholder="Descrição (opcional)"
        rows={3}
        disabled={busy}
        className="w-full resize-none rounded-md border border-border/70 bg-card px-2.5 py-1.5 text-[11px] leading-snug focus:outline-none focus:border-primary/60 disabled:opacity-50"
      />
      <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 px-0.5">
        <span>⌘⏎ pra commitar</span>
        <span
          className={cn(
            'tabular-nums',
            remaining < 0
              ? 'text-destructive'
              : remaining < 10
                ? 'text-orange-500'
                : 'text-muted-foreground/40'
          )}
        >
          {remaining}
        </span>
      </div>
      {error && (
        <div className="text-[10px] text-destructive bg-destructive/10 rounded px-1.5 py-1 border border-destructive/30 break-words">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={commit}
        disabled={!canCommit}
        title={`Commit ${pendingCount} arquivo${pendingCount !== 1 ? 's' : ''} em ${branch}`}
        className={cn(
          'h-7 w-full rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 px-2.5 transition-colors min-w-0 overflow-hidden',
          canCommit
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground/60 cursor-not-allowed'
        )}
      >
        {busy && <Loader2 className="size-3 animate-spin flex-shrink-0" />}
        <span className="flex-shrink-0 whitespace-nowrap">
          Commit {pendingCount} arquivo{pendingCount !== 1 ? 's' : ''} em
        </span>
        <span className="font-mono font-bold flex-1 min-w-0 truncate text-left">
          {branch}
        </span>
      </button>
      {lastCommitted && (
        <div className="mt-1 flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/30 px-2 py-1.5">
          <Check className="size-3 text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-green-500 font-medium leading-tight">
              Commitado {relativeTime(lastCommitted.at)}
            </div>
            <div className="text-[11px] text-foreground/80 truncate" title={lastCommitted.summary}>
              {lastCommitted.summary}
            </div>
          </div>
          <button
            type="button"
            onClick={undo}
            disabled={undoBusy}
            title="Desfaz o último commit · mantém alterações no working tree"
            className="flex-shrink-0 inline-flex items-center gap-1 px-2 h-6 text-[10px] rounded border border-border/60 bg-card/60 hover:bg-accent/60 disabled:opacity-50"
          >
            {undoBusy ? <Loader2 className="size-2.5 animate-spin" /> : <Undo2 className="size-2.5" />}
            Desfazer
          </button>
        </div>
      )}
    </div>
  )
}
