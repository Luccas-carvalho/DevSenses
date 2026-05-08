import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Layers } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { DEPTH_LABELS, DEPTH_DESCRIPTIONS } from '@/lib/diffPrompt'
import type { ExplanationDepth } from '@shared/settings'
import type { SeniorityLevel } from '@shared/seniority'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

interface Props {
  onChange?: (depth: ExplanationDepth) => void
}

const DEPTHS: ExplanationDepth[] = [1, 2, 3, 4, 5]

const SENIORITY_DEFAULT_DEPTH: Record<SeniorityLevel, ExplanationDepth> = {
  intern: 2,
  junior: 3,
  mid: 3,
  senior: 4
}

const DEPTH_TINT: Record<ExplanationDepth, string> = {
  1: 'text-emerald-400',
  2: 'text-sky-400',
  3: 'text-primary',
  4: 'text-amber-400',
  5: 'text-rose-400'
}

export default function DepthSlider({ onChange }: Props): React.ReactElement {
  const { value: stored } = useSettings('explanation_depth')
  const { value: seniority } = useSettings('seniority')
  const [depth, setDepth] = useState<ExplanationDepth>(3)
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (stored != null) {
      setDepth(stored as ExplanationDepth)
    } else if (seniority) {
      const auto = SENIORITY_DEFAULT_DEPTH[seniority as SeniorityLevel] ?? 3
      setDepth(auto)
      void window.api.invoke('settings:set', { key: 'explanation_depth', value: auto })
    }
  }, [stored, seniority])

  useEffect(() => {
    if (!open) return
    const r = btnRef.current?.getBoundingClientRect()
    if (r) {
      const PANEL_W = 280
      const desired = r.left
      const maxLeft = window.innerWidth - PANEL_W - 12
      setPos({ top: r.bottom + 6, left: Math.max(12, Math.min(desired, maxLeft)) })
    }
    function handleClick(e: MouseEvent): void {
      const t = e.target as Node
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function pick(next: ExplanationDepth): void {
    setOpen(false)
    if (next === depth) return
    setDepth(next)
    void window.api.invoke('settings:set', { key: 'explanation_depth', value: next })
    onChange?.(next)
  }

  return (
    <>
      <Tooltip label={`Detalhe da explicação · ${DEPTH_LABELS[depth]}`}>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex items-center gap-1.5 h-7 px-2 rounded-md border border-border/40 bg-muted/40 transition-colors hover:bg-muted/60',
            open && 'bg-muted/70 border-border/60'
          )}
        >
          <Layers className={cn('size-3.5', DEPTH_TINT[depth])} />
          <span className="text-[11.5px] font-medium text-foreground/85">
            {DEPTH_LABELS[depth]}
          </span>
          <ChevronDown
            className={cn(
              'size-3 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      </Tooltip>

      {open &&
        pos &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[2147483000] w-[280px] rounded-lg border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-1 ds-fade-up"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
              Detalhe da explicação
            </div>
            {DEPTHS.map((d) => {
              const active = d === depth
              return (
                <button
                  key={d}
                  onClick={() => pick(d)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
                    active ? 'bg-primary/15' : 'hover:bg-accent/60'
                  )}
                >
                  <span
                    className={cn(
                      'size-8 rounded-md flex items-center justify-center flex-shrink-0',
                      active ? 'bg-primary/20' : 'bg-muted/50'
                    )}
                  >
                    <Layers className={cn('size-4', DEPTH_TINT[d])} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12.5px] font-semibold text-foreground">
                        {DEPTH_LABELS[d]}
                      </span>
                      {active && <Check className="size-3 text-primary flex-shrink-0" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 break-words">
                      {DEPTH_DESCRIPTIONS[d]}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
