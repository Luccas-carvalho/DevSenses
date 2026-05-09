import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Bot, User, Sparkles, AlertCircle } from 'lucide-react'
import { detectAIAuthorship } from '@/lib/aiAuthorship'
import { cn } from '@/lib/utils'

interface Props {
  diff: string
  className?: string
}

const VERDICT_LABEL = {
  human: 'Provavelmente humano',
  mixed: 'Misto',
  'ai-likely': 'Provavelmente IA',
  'ai-very-likely': 'Quase certo IA'
}

const VERDICT_COLOR = {
  human: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
  mixed: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
  'ai-likely': 'bg-violet-500/20 border-violet-500/45 text-violet-300',
  'ai-very-likely': 'bg-rose-500/15 border-rose-500/40 text-rose-400'
}

const VERDICT_ICON = {
  human: User,
  mixed: AlertCircle,
  'ai-likely': Sparkles,
  'ai-very-likely': Bot
}

export default function AuthorshipBadge({ diff, className }: Props): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const result = detectAIAuthorship(diff)
  if (result.signals.length === 0 && result.verdict === 'human') return null

  const Icon = VERDICT_ICON[result.verdict]
  const color = VERDICT_COLOR[result.verdict]

  function handleClick(e: React.MouseEvent<HTMLButtonElement>): void {
    const r = e.currentTarget.getBoundingClientRect()
    const PANEL_W = 320
    const desired = r.right - PANEL_W
    const maxLeft = window.innerWidth - PANEL_W - 12
    setPos({
      top: r.bottom + 6,
      left: Math.max(12, Math.min(desired, maxLeft))
    })
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={`${VERDICT_LABEL[result.verdict]} · ${result.score}/100 — clique pra ver sinais`}
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-2 py-0.5 border transition-colors',
          color,
          className
        )}
      >
        <Icon className="size-2.5" />
        {VERDICT_LABEL[result.verdict]}
        <span className="font-mono opacity-70 ml-0.5">{result.score}</span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            className="fixed z-[2147483000] w-[320px] rounded-lg border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 ds-fade-up"
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2.5 border-b border-border/40 flex items-center gap-2">
              <Icon className={cn('size-3.5', color.split(' ').find((c) => c.startsWith('text-')))} />
              <span className="text-[12px] font-semibold text-foreground">
                {VERDICT_LABEL[result.verdict]}
              </span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                score {result.score}/100
              </span>
            </div>
            <div className="px-3 py-2.5 max-h-[280px] overflow-auto">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2">
                Sinais detectados
              </div>
              {result.signals.length === 0 ? (
                <div className="text-[12px] text-muted-foreground italic">
                  Nenhum sinal forte. Provavelmente humano.
                </div>
              ) : (
                <ul className="space-y-2">
                  {result.signals.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="text-[10px] font-mono font-bold rounded px-1 py-0.5 bg-muted/60 text-foreground/80 flex-shrink-0 mt-0.5"
                        title="pontos contribuídos pro score"
                      >
                        +{s.weight}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-foreground">{s.label}</div>
                        <div className="text-[10.5px] text-muted-foreground/80 leading-snug mt-0.5">
                          {s.detail}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-3 py-2 border-t border-border/40 text-[10px] text-muted-foreground/70 italic">
              Heurística informativa — não é prova definitiva.
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
