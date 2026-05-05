import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="max-w-3xl">
      <header className="mb-6 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <BookOpen className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-0.5">Glossário</h2>
          <p className="text-xs text-muted-foreground">
            Conceitos que a IA já te ensinou nas análises de diff. {counts.total} no total
            · {counts.learned} marcados como aprendidos.
          </p>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conceito..."
            className="w-full pl-8 pr-3 h-8 rounded-md border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
          {(['all', 'pending', 'learned'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 h-7 text-xs rounded transition-colors',
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

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
          <Sparkles className="size-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? 'Nenhum conceito ainda. Roda uma análise pra começar.'
              : 'Nada por aqui com esse filtro.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((c) => (
            <li
              key={c.id}
              className={cn(
                'group rounded-lg border bg-card/50 p-3 flex items-start gap-3 transition-colors',
                c.markedLearned ? 'border-green-500/30 bg-green-500/5' : 'border-border/50'
              )}
            >
              <button
                type="button"
                title={c.markedLearned ? 'Desmarcar' : 'Marcar como aprendido'}
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[12px] font-mono text-primary">
                    {c.name}
                  </code>
                  <span className="text-[10px] text-muted-foreground/70">
                    {c.timesSeen}× · primeira vez {relative(c.firstSeenAt)}
                  </span>
                </div>
                {c.lastNote && (
                  <p className="text-xs text-foreground/75 mt-1 leading-relaxed">
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
