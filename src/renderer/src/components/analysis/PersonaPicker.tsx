import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown,
  Check,
  Compass,
  HeartHandshake,
  Zap,
  Flame,
  GraduationCap
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { PERSONAS, PERSONA_ORDER, type PersonaId, type PersonaIcon } from '@shared/personas'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

interface Props {
  onChange?: (persona: PersonaId) => void
}

const ICON_MAP: Record<PersonaIcon, typeof Compass> = {
  Compass,
  HeartHandshake,
  Zap,
  Flame,
  GraduationCap
}

const ICON_TINT: Record<PersonaId, string> = {
  default: 'text-primary',
  mentor: 'text-emerald-400',
  pragmatic: 'text-amber-400',
  sarcastic: 'text-rose-400',
  academic: 'text-sky-400'
}

export default function PersonaPicker({ onChange }: Props): React.ReactElement {
  const { value: stored } = useSettings('explanation_persona')
  const [persona, setPersona] = useState<PersonaId>('default')
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (stored) setPersona(stored as PersonaId)
  }, [stored])

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

  function pick(p: PersonaId): void {
    setPersona(p)
    setOpen(false)
    void window.api.invoke('settings:set', { key: 'explanation_persona', value: p })
    onChange?.(p)
  }

  const current = PERSONAS[persona]
  const CurrentIcon = ICON_MAP[current.icon]

  return (
    <>
      <Tooltip label={`Persona · ${current.short}`}>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex items-center gap-1.5 h-7 px-2 rounded-md border border-border/40 bg-muted/40 transition-colors hover:bg-muted/60',
            open && 'bg-muted/70 border-border/60'
          )}
        >
          <CurrentIcon className={cn('size-3.5', ICON_TINT[persona])} />
          <span className="text-[11.5px] font-medium text-foreground/85">{current.label}</span>
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
              Persona do tutor
            </div>
            {PERSONA_ORDER.map((id) => {
              const p = PERSONAS[id]
              const Icon = ICON_MAP[p.icon]
              const active = id === persona
              return (
                <button
                  key={id}
                  onClick={() => pick(id)}
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
                    <Icon className={cn('size-4', ICON_TINT[id])} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12.5px] font-semibold text-foreground">
                        {p.label}
                      </span>
                      {active && <Check className="size-3 text-primary flex-shrink-0" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 break-words">
                      {p.short}
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
