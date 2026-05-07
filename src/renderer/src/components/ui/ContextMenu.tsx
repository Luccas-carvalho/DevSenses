import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ContextMenuItem {
  type?: 'item' | 'separator' | 'submenu'
  label?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  destructive?: boolean
  disabled?: boolean
  primary?: boolean
  onClick?: () => void
  items?: ContextMenuItem[]
}

interface Props {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

const MIN_W = 220

export default function ContextMenu({ x, y, items, onClose }: Props): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: x, top: y })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let left = x
    let top = y
    if (left + rect.width + 8 > window.innerWidth) left = window.innerWidth - rect.width - 8
    if (top + rect.height + 8 > window.innerHeight) top = window.innerHeight - rect.height - 8
    if (left < 8) left = 8
    if (top < 8) top = 8
    setPos({ left, top })
  }, [x, y])

  useEffect(() => {
    function onDoc(e: MouseEvent): void {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      role="menu"
      className="fixed rounded-lg border border-border bg-popover shadow-2xl overflow-visible z-[2147483000] py-1 text-foreground"
      style={{ left: pos.left, top: pos.top, minWidth: MIN_W }}
    >
      {items.map((it, i) => (
        <Item key={i} item={it} onClose={onClose} />
      ))}
    </div>,
    document.body
  )
}

function Item({ item, onClose }: { item: ContextMenuItem; onClose: () => void }): ReactNode {
  const [hover, setHover] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const [submenuPos, setSubmenuPos] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    if (item.type !== 'submenu' || !hover) {
      setSubmenuPos(null)
      return
    }
    const r = ref.current?.getBoundingClientRect()
    if (r) setSubmenuPos({ left: r.right + 2, top: r.top - 4 })
  }, [hover, item.type])

  if (item.type === 'separator') {
    return <div className="my-1 border-t border-border/40" />
  }

  const Icon = item.icon
  const isSubmenu = item.type === 'submenu'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative"
    >
      <button
        ref={ref}
        type="button"
        disabled={item.disabled}
        onClick={() => {
          if (isSubmenu) return
          item.onClick?.()
          onClose()
        }}
        className={cn(
          'w-full px-3 py-1.5 flex items-center gap-2 text-[12px] text-left rounded-sm',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          item.destructive
            ? 'text-destructive hover:bg-destructive/10'
            : item.primary
              ? hover
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground'
              : hover
                ? 'bg-accent'
                : 'text-foreground'
        )}
      >
        {Icon && <Icon className="size-3 flex-shrink-0 opacity-70" />}
        <span className="flex-1 truncate">{item.label}</span>
        {item.shortcut && (
          <span className="text-[10px] font-mono text-muted-foreground/60 ml-2">
            {item.shortcut}
          </span>
        )}
        {isSubmenu && <ChevronRight className="size-3 text-muted-foreground/60" />}
      </button>
      {isSubmenu && hover && submenuPos && item.items && createPortal(
        <div
          className="fixed rounded-lg border border-border bg-popover shadow-2xl overflow-visible z-[2147483001] py-1 text-foreground"
          style={{ left: submenuPos.left, top: submenuPos.top, minWidth: MIN_W }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {item.items.map((sub, i) => (
            <Item key={i} item={sub} onClose={onClose} />
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
