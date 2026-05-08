import { useEffect, useState } from 'react'
import { Loader2, GitCommit } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CommitInfoExtended } from '@shared/git'

interface Props {
  path: string
  refreshKey?: number
  selectedHash: string | null
  onSelect: (hash: string | null) => void
}

function relativeTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.round(diffH / 24)
  if (diffD < 30) return `${diffD}d`
  const diffM = Math.round(diffD / 30)
  if (diffM < 12) return `${diffM}mo`
  return `${Math.round(diffM / 12)}y`
}

function gravatarUrl(email: string): string {
  const e = (email ?? '').trim().toLowerCase()
  return `https://www.gravatar.com/avatar/${hashEmail(e)}?s=40&d=identicon`
}

function hashEmail(email: string): string {
  let h = 0
  for (let i = 0; i < email.length; i++) {
    h = (h * 31 + email.charCodeAt(i)) >>> 0
  }
  return h.toString(16).padStart(8, '0').slice(0, 8)
}

export default function HistoryTab({
  path,
  refreshKey,
  selectedHash,
  onSelect
}: Props): React.ReactElement {
  const [commits, setCommits] = useState<CommitInfoExtended[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!path) return
    setLoading(true)
    window.api
      .invoke('git:logExtended', { path, limit: 100 })
      .then(setCommits)
      .catch(() => setCommits([]))
      .finally(() => setLoading(false))
  }, [path, refreshKey])

  const filtered = filter
    ? commits.filter(
        (c) =>
          c.message.toLowerCase().includes(filter.toLowerCase()) ||
          c.author.toLowerCase().includes(filter.toLowerCase()) ||
          c.short.includes(filter)
      )
    : commits

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2 border-b border-border/40">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar commits…"
          className="w-full rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px] focus:outline-none focus:border-primary/60"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-[11px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            carregando…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic p-3">
            {filter ? 'Nada com esse filtro.' : 'Sem commits.'}
          </p>
        ) : (
          <ul>
            {filtered.map((c) => {
              const isSelected = selectedHash === c.hash
              return (
                <li key={c.hash}>
                  <button
                    type="button"
                    onClick={() => onSelect(isSelected ? null : c.hash)}
                    className={cn(
                      'w-full flex items-start gap-2 px-3 py-2 text-left transition-colors border-b border-border/20',
                      isSelected ? 'bg-primary/10' : 'hover:bg-accent/40'
                    )}
                    title={`${c.short} · ${c.author} <${c.email}>`}
                  >
                    <img
                      src={gravatarUrl(c.email)}
                      alt={c.author}
                      className="size-5 rounded-full flex-shrink-0 mt-0.5 bg-muted"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-[11px] font-medium truncate flex-1',
                            isSelected ? 'text-primary' : 'text-foreground/90'
                          )}
                        >
                          {c.message}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <code className="text-[9px] font-mono text-muted-foreground/60">
                          {c.short}
                        </code>
                        <span className="text-[9px] text-muted-foreground/40">·</span>
                        <span className="text-[10px] text-muted-foreground/70 truncate">
                          {c.author}
                        </span>
                        <span className="text-[9px] text-muted-foreground/40">·</span>
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                          {relativeTime(c.date)}
                        </span>
                        {c.refs.length > 0 && (
                          <span className="text-[9px] text-primary/70 truncate">
                            {c.refs.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <GitCommit className="size-3 text-primary flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
