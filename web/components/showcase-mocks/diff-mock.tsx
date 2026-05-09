'use client'
import { Sparkles, Activity } from 'lucide-react'

export function DiffMock() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-card grid grid-cols-[1.05fr_1fr] divide-x divide-border/50">
      {/* Diff side */}
      <div className="relative font-mono text-[11px] leading-[1.85] py-4 overflow-hidden">
        <div className="px-4 pb-2 flex items-center gap-2 border-b border-border/40 mb-2">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">flow.ts</span>
          <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-rose-500/40 bg-rose-500/10 text-rose-400 text-[9px] uppercase tracking-widest">
            <Activity size={9} />
            O(n²)
          </span>
        </div>
        <div className="px-1 space-y-px">
          {DIFF_LINES.map((l, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-px whitespace-nowrap ${
                l.kind === 'add'
                  ? 'bg-emerald-500/[0.08] border-l-2 border-emerald-500/60 text-emerald-300'
                  : l.kind === 'del'
                  ? 'bg-rose-500/[0.08] border-l-2 border-rose-500/60 text-rose-300'
                  : 'border-l-2 border-transparent text-foreground/75'
              }`}
            >
              <span className="text-muted-foreground/50 w-4 text-right shrink-0">{l.n}</span>
              <span className="shrink-0">{l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ' '}</span>
              <span className="truncate">{l.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation side */}
      <div className="relative bg-gradient-to-br from-primary/[0.05] to-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border/40 flex items-center gap-1.5">
          <Sparkles size={11} className="text-primary" />
          <span className="text-[9px] font-mono text-primary uppercase tracking-widest">streaming · markdown</span>
        </div>
        <div className="px-4 py-4 text-[11.5px] leading-relaxed space-y-2">
          <p className="text-foreground/90">
            <span className="font-semibold">forEach + includes</span> dentro de loop é{' '}
            <span className="text-rose-400 font-mono">O(n²)</span>.
          </p>
          <p className="text-foreground/80">
            Pra cada item de <span className="font-mono text-primary underline decoration-dotted underline-offset-2">tickets</span>,
            tu varre <span className="font-mono text-primary underline decoration-dotted underline-offset-2">closed</span> inteiro.
          </p>
          <p className="text-foreground/80">
            Substitui <span className="font-mono">closed.includes</span> por um{' '}
            <span className="font-mono text-primary underline decoration-dotted underline-offset-2">Set</span> →{' '}
            <span className="text-emerald-400 font-mono">O(n)</span>.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-primary/30 bg-primary/10 text-primary text-[9px] font-mono uppercase tracking-widest">
            <span className="size-1 rounded-full bg-primary animate-flicker" />
            5 termos clicáveis
          </div>
        </div>
      </div>
    </div>
  )
}

const DIFF_LINES = [
  { n: 1, t: 'export function syncTickets(', kind: 'plain' as const },
  { n: 2, t: '  tickets: Ticket[],', kind: 'plain' as const },
  { n: 3, t: '  closed: string[]', kind: 'plain' as const },
  { n: 4, t: ') {', kind: 'plain' as const },
  { n: 5, t: '  return tickets.filter(t =>', kind: 'del' as const },
  { n: 6, t: '    !closed.includes(t.id))', kind: 'del' as const },
  { n: 7, t: '  const closedSet = new Set(closed)', kind: 'add' as const },
  { n: 8, t: '  return tickets.filter(t =>', kind: 'add' as const },
  { n: 9, t: '    !closedSet.has(t.id))', kind: 'add' as const },
  { n: 10, t: '}', kind: 'plain' as const },
]
