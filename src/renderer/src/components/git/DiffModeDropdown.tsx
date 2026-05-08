import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Layers, Pencil, GitCommit, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Tooltip from '@/components/ui/Tooltip'
import type { DiffMode } from '@shared/settings'

const OPTIONS: { value: DiffMode; label: string; icon: typeof Layers; tip: string }[] = [
  { value: 'all', label: 'Tudo', icon: Layers, tip: 'Commits recentes + não commitado' },
  { value: 'uncommitted', label: 'Pendente', icon: Pencil, tip: 'Apenas alterações não commitadas' },
  { value: 'committed', label: 'Commits', icon: GitCommit, tip: 'Apenas commits recentes' }
]

interface Props {
  mode: DiffMode
  onChange: (mode: DiffMode) => void
}

export default function DiffModeDropdown({ mode, onChange }: Props): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const w = 220
      setPos({
        left: Math.max(8, rect.left),
        top: rect.bottom + 4,
        width: w
      })
    }
    const handler = (e: MouseEvent): void => {
      const t = e.target as Node
      if (buttonRef.current?.contains(t) || popupRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[0]
  const Icon = current.icon

  return (
    <>
      <Tooltip label={`Modo de diff · ${current.tip}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border/60 bg-card/60 text-[11px] text-foreground hover:bg-accent/60"
        >
          <Icon className="size-3" />
          <span className="font-medium">{current.label}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </Tooltip>

      {open &&
        pos &&
        createPortal(
          <div
            ref={popupRef}
            className="fixed rounded-md border border-border bg-popover shadow-2xl z-[2147483000] overflow-hidden"
            style={{ left: pos.left, top: pos.top, width: pos.width }}
          >
            {OPTIONS.map((opt) => {
              const O = opt.icon
              const active = opt.value === mode
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-start gap-2 px-2.5 py-2 text-left transition-colors',
                    active ? 'bg-primary/10' : 'hover:bg-accent/60'
                  )}
                >
                  {active ? (
                    <Check className="size-3 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <O className="size-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-foreground">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground/70 leading-tight">
                      {opt.tip}
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
