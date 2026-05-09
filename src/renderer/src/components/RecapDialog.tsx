import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X, BookOpen } from 'lucide-react'
import MasteryDots from '@/components/analysis/MasteryDots'

interface SeenConcept {
  name: string
  firstSeenAt: number
  timesSeen: number
  masteryLevel: number
}

interface Props {
  open: boolean
  onClose: () => void
  /** how far back to look — defaults to start of today (local) */
  since?: number
  title?: string
}

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export default function RecapDialog({
  open,
  onClose,
  since,
  title = 'Recap do dia'
}: Props): React.JSX.Element | null {
  const [concepts, setConcepts] = useState<SeenConcept[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const sinceMs = since ?? startOfToday()
    window.api
      .invoke('concepts:seenSince', { since: sinceMs })
      .then((r) => setConcepts(r))
      .catch(() => setConcepts([]))
      .finally(() => setLoading(false))

    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, since, onClose])

  if (!open) return null

  const mastered = concepts.filter((c) => c.masteryLevel >= 3).length
  const learning = concepts.filter((c) => c.masteryLevel >= 1 && c.masteryLevel < 3).length
  const fresh = concepts.filter((c) => c.masteryLevel === 0).length

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] flex items-center justify-center p-6 bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[80vh] flex flex-col bg-popover border border-border/60 rounded-xl shadow-2xl shadow-black/40 ds-fade-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4 min-h-0">
          {loading && (
            <div className="text-[12px] text-muted-foreground italic">Carregando...</div>
          )}

          {!loading && concepts.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="size-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground">
                Nenhum conceito novo hoje. Abre um repo e pede uma explicação pra começar.
              </p>
            </div>
          )}

          {!loading && concepts.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Stat label="Dominados" value={mastered} tint="text-emerald-400" />
                <Stat label="Aprendendo" value={learning} tint="text-sky-400" />
                <Stat label="Novos" value={fresh} tint="text-primary" />
              </div>

              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2">
                Conceitos vistos hoje
              </div>
              <ul className="space-y-1.5">
                {concepts.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/40 bg-card/40"
                  >
                    <code className="text-[12px] font-mono font-semibold text-primary flex-1 truncate">
                      {c.name}
                    </code>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {c.timesSeen}×
                    </span>
                    <MasteryDots level={c.masteryLevel} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-2 flex-shrink-0">
          <span className="text-[11px] text-muted-foreground italic">
            {concepts.length > 0
              ? `${concepts.length} conceito${concepts.length !== 1 ? 's' : ''} esse período`
              : 'Sem dados ainda'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] rounded-md px-3 h-7 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Stat({
  label,
  value,
  tint
}: {
  label: string
  value: number
  tint: string
}): React.JSX.Element {
  return (
    <div className="rounded-md border border-border/40 bg-card/40 px-3 py-2 text-center">
      <div className={`text-2xl font-bold ${tint} tabular-nums`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  )
}
