import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type Side = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  label: ReactNode
  side?: Side
  align?: 'start' | 'center' | 'end'
  delay?: number
  shortcut?: string
  className?: string
  children: ReactElement
  disabled?: boolean
}

const GAP = 6

export default function Tooltip({
  label,
  side = 'bottom',
  align = 'center',
  delay = 350,
  shortcut,
  className,
  children,
  disabled
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  function compute(): void {
    const trigger = triggerRef.current
    const tip = tooltipRef.current
    if (!trigger || !tip) return
    const rect = trigger.getBoundingClientRect()
    const tw = tip.offsetWidth
    const th = tip.offsetHeight
    let top = 0
    let left = 0
    if (side === 'top') {
      top = rect.top - th - GAP
      left = rect.left + rect.width / 2 - tw / 2
    } else if (side === 'bottom') {
      top = rect.bottom + GAP
      left = rect.left + rect.width / 2 - tw / 2
    } else if (side === 'left') {
      top = rect.top + rect.height / 2 - th / 2
      left = rect.left - tw - GAP
    } else {
      top = rect.top + rect.height / 2 - th / 2
      left = rect.right + GAP
    }
    if (align === 'start') {
      if (side === 'top' || side === 'bottom') left = rect.left
      else top = rect.top
    } else if (align === 'end') {
      if (side === 'top' || side === 'bottom') left = rect.right - tw
      else top = rect.bottom - th
    }
    const margin = 6
    left = Math.max(margin, Math.min(window.innerWidth - tw - margin, left))
    top = Math.max(margin, Math.min(window.innerHeight - th - margin, top))
    setPos({ top, left })
  }

  useEffect(() => {
    if (!open) return
    compute()
    const onScroll = (): void => compute()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function show(): void {
    if (disabled) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setOpen(true), delay)
  }

  function hide(): void {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setOpen(false)
    setPos(null)
  }

  if (!isValidElement(children)) return children

  type WithRef = {
    ref?: React.Ref<HTMLElement>
    onMouseEnter?: (e: React.MouseEvent) => void
    onMouseLeave?: (e: React.MouseEvent) => void
    onFocus?: (e: React.FocusEvent) => void
    onBlur?: (e: React.FocusEvent) => void
  }
  const childProps = children.props as WithRef
  const trigger = cloneElement(children as ReactElement<WithRef>, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node
      const orig = (children as ReactElement & { ref?: React.Ref<HTMLElement> }).ref
      if (typeof orig === 'function') orig(node)
      else if (orig && 'current' in orig) (orig as React.MutableRefObject<HTMLElement | null>).current = node
    },
    onMouseEnter: (e: React.MouseEvent) => {
      childProps.onMouseEnter?.(e)
      show()
    },
    onMouseLeave: (e: React.MouseEvent) => {
      childProps.onMouseLeave?.(e)
      hide()
    },
    onFocus: (e: React.FocusEvent) => {
      childProps.onFocus?.(e)
      show()
    },
    onBlur: (e: React.FocusEvent) => {
      childProps.onBlur?.(e)
      hide()
    }
  })

  const style: CSSProperties = pos
    ? { position: 'fixed', top: pos.top, left: pos.left, zIndex: 2147483000 }
    : { position: 'fixed', top: -9999, left: -9999, zIndex: 2147483000, opacity: 0 }

  return (
    <>
      {trigger}
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={style}
            className={cn(
              'pointer-events-none select-none rounded-md border border-border/60 bg-popover/95 backdrop-blur px-2 py-1 text-[11px] text-popover-foreground shadow-lg',
              'animate-in fade-in-0 zoom-in-95 duration-100',
              className
            )}
          >
            <span className="whitespace-nowrap">{label}</span>
            {shortcut && (
              <span className="ml-2 rounded border border-border/60 bg-muted/40 px-1 text-[10px] font-mono text-muted-foreground">
                {shortcut}
              </span>
            )}
          </div>,
          document.body
        )}
    </>
  )
}
