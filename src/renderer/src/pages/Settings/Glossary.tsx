import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Tooltip from '@/components/ui/Tooltip'

interface SeenConcept {
  id: number
  name: string
  category: string
  language: string | null
  framework: string | null
  firstSeenAt: number
  timesSeen: number
  markedLearned: boolean
  lastNote: string | null
}

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

function relative(ts: number): string {
  const diffMs = ts - Date.now()
  const diffMin = Math.round(diffMs / 60_000)
  if (Math.abs(diffMin) < 60) return RELATIVE_FORMATTER.format(diffMin, 'minute')
  const diffH = Math.round(diffMin / 60)
  if (Math.abs(diffH) < 24) return RELATIVE_FORMATTER.format(diffH, 'hour')
  const diffD = Math.round(diffH / 24)
  return RELATIVE_FORMATTER.format(diffD, 'day')
}

export default function Glossary() {
  const [items, setItems] = useState<SeenConcept[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'learned'>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    window.api
      .invoke('concepts:list', undefined)
      .then((rows) => {
        if (active) setItems(rows ?? [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function toggleLearned(id: number, current: boolean): Promise<void> {
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, markedLearned: !current } : c))
    )
    try {
      await window.api.invoke('concepts:setLearned', { id, learned: !current })
    } catch {
      // revert
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, markedLearned: current } : c))
      )
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((c) => {
      if (filter === 'pending' && c.markedLearned) return false
      if (filter === 'learned' && !c.markedLearned) return false
      if (q && !`${c.name} ${c.lastNote ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, filter, query])

  const counts = useMemo(() => {
    const total = items.length
    const learned = items.filter((c) => c.markedLearned).length
    return { total, learned, pending: total - learned }
  }, [items])

  return (
    <div className="w-full ds-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <BookOpen className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Glossário</h2>
          <p className="text-[11px] text-muted-foreground">
            Conceitos que a IA já te ensinou nas análises de diff
          </p>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex items-center gap-2 mb-4">
        <span className="rounded-full bg-muted/60 border border-border/40 px-2.5 py-0.5 text-[11px] text-foreground/70 font-medium">
          {counts.total} total
        </span>
        <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-[11px] text-green-400 font-medium">
          {counts.learned} aprendidos
        </span>
        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] text-amber-400 font-medium">
          {counts.pending} a aprender
        </span>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conceito..."
            className="w-full pl-8 pr-3 h-8 rounded-lg border border-border/60 bg-card/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm"
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/60 p-0.5 backdrop-blur-sm">
          {(['all', 'pending', 'learned'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 h-7 text-xs rounded-md transition-colors',
                filter === f
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'A aprender' : 'Aprendidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl border border-border/40 bg-muted/20 animate-pulse"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center">
            <Sparkles className="size-6 text-muted-foreground/30" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/70">
              {items.length === 0 ? 'Nenhum conceito ainda' : 'Nada com esse filtro'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {items.length === 0
                ? 'Rode uma análise de diff para começar a construir seu glossário'
                : 'Tente ajustar o filtro ou a busca'}
            </p>
          </div>
        </div>
      ) : (
        /* Grid layout when ≥4 items */
        <ul
          className={cn(
            'gap-2',
            visible.length >= 4 ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col'
          )}
        >
          {visible.map((c) => (
            <li
              key={c.id}
              className={cn(
                'group rounded-xl border bg-card/60 backdrop-blur-sm p-3.5 flex items-start gap-3 transition-all',
                c.markedLearned
                  ? 'border-green-500/25 bg-green-500/5'
                  : 'border-border/50 hover:border-border/80'
              )}
            >
              <Tooltip
                label={c.markedLearned ? 'Desmarcar como aprendido' : 'Marcar como aprendido'}
              >
                <button
                  type="button"
                  onClick={() => toggleLearned(c.id, c.markedLearned)}
                  className={cn(
                    'mt-0.5 flex-shrink-0 transition-colors',
                    c.markedLearned
                      ? 'text-green-500 hover:text-green-400'
                      : 'text-muted-foreground/30 hover:text-primary'
                  )}
                >
                  <CheckCircle2 className="size-5" />
                </button>
              </Tooltip>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[12px] font-mono text-primary">
                    {c.name}
                  </code>
                  {/* Category badge */}
                  {c.category && (
                    <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground/70">
                      {c.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-muted-foreground/60">
                    {c.timesSeen}× · {relative(c.firstSeenAt)}
                  </span>
                </div>
                {c.lastNote && (
                  <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
                    {c.lastNote}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
