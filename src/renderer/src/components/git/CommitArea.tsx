import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'

const SUMMARY_MAX = 72

interface Props {
  path: string
  branch: string
  stagedCount: number
  onCommitted: () => void
}

export default function CommitArea({
  path,
  branch,
  stagedCount,
  onCommitted
}: Props): React.ReactElement {
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { value: avatar } = useSettings('user_avatar')
  const { value: name } = useSettings('user_name')
  const initial = (typeof name === 'string' && name.trim().length > 0
    ? name.trim()[0]
    : '?'
  ).toUpperCase()

  useEffect(() => {
    setError('')
  }, [path, branch])

  async function commit(): Promise<void> {
    if (!summary.trim() || busy || stagedCount === 0) return
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

  const remaining = SUMMARY_MAX - summary.length
  const canCommit = !busy && stagedCount > 0 && summary.trim().length > 0
  const branchShort = branch.length > 24 ? `${branch.slice(0, 22)}…` : branch

  return (
    <div className="border-t border-border/40 bg-card/40 p-2.5 flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-[11px] font-bold text-primary-foreground overflow-hidden flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
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
          disabled={busy || stagedCount === 0}
          className="flex-1 rounded-md border border-border/60 bg-background/80 px-2.5 h-7 text-[12px] focus:outline-none focus:border-primary/60 disabled:opacity-50"
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
        disabled={busy || stagedCount === 0}
        className="w-full resize-none rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[11px] leading-snug focus:outline-none focus:border-primary/60 disabled:opacity-50"
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
        className={cn(
          'h-9 w-full rounded-md text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors',
          canCommit
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground/60 cursor-not-allowed'
        )}
      >
        {busy && <Loader2 className="size-3 animate-spin" />}
        {stagedCount === 0
          ? 'Nada pra commitar'
          : `Commit ${stagedCount} arquivo${stagedCount !== 1 ? 's' : ''} em `}
        {stagedCount > 0 && (
          <span className="font-mono font-bold">{branchShort}</span>
        )}
      </button>
    </div>
  )
}
