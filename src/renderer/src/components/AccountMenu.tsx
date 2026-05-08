import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Sun,
  Moon,
  Monitor,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import { SENIORITY_LABELS } from '@shared/seniority'
import type { ThemeMode } from '@shared/settings'

interface Props {
  size?: number
  className?: string
  side?: 'above' | 'right'
}

export default function AccountMenu({
  size = 28,
  className,
  side = 'above'
}: Props): React.ReactElement {
  const { value: avatar } = useSettings('user_avatar')
  const { value: name } = useSettings('user_name')
  const { value: seniority } = useSettings('seniority')
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const initial = (typeof name === 'string' && name.trim().length > 0
    ? name.trim()[0]
    : '?'
  ).toUpperCase()

  const MENU_W = 200
  const MENU_H = 132

  useEffect(() => {
    if (!open) return
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      if (side === 'right') {
        setPos({
          left: rect.right + 6,
          top: Math.min(window.innerHeight - MENU_H - 8, Math.max(8, rect.top))
        })
      } else {
        setPos({
          left: Math.max(8, rect.left),
          top: Math.max(8, rect.top - MENU_H - 6)
        })
      }
    }
    function onClick(e: MouseEvent): void {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || popupRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, side])

  function cycleTheme(): void {
    const order: ThemeMode[] = ['light', 'dark', 'auto']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
    window.api.invoke('settings:set', { key: 'theme', value: next })
  }

  async function logout(): Promise<void> {
    setOpen(false)
    await window.api.invoke('settings:set', { key: 'onboarding_completed', value: false })
    navigate('/')
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`${typeof name === 'string' && name ? name : 'Conta'} · clica pra menu`}
        className={cn(
          'rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-[11px] font-bold text-primary-foreground overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-primary/40 transition-all',
          className
        )}
        style={{ width: size, height: size }}
      >
        {avatar ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </button>
      {open && pos && createPortal(
        <div
          ref={popupRef}
          className="fixed rounded-xl border border-border bg-popover shadow-2xl overflow-hidden z-[2147483000]"
          style={{ left: pos.left, top: pos.top, width: MENU_W }}
        >
          <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
            <div className="text-[11px] font-medium text-foreground flex-1 min-w-0 truncate">
              {typeof name === 'string' && name ? name : 'Dev'}
            </div>
            {seniority && (
              <span className="text-[10px] text-muted-foreground/70 flex-shrink-0 capitalize">
                {SENIORITY_LABELS[seniority as keyof typeof SENIORITY_LABELS] ?? seniority}
              </span>
            )}
          </div>
          <button
            onClick={cycleTheme}
            className="w-full px-3 py-2 flex items-center gap-2 text-[11px] hover:bg-accent transition-colors text-left"
          >
            <ThemeIcon className="size-3 text-muted-foreground" />
            <span>Alterar tema</span>
            <span className="ml-auto text-[10px] text-muted-foreground/70 capitalize">
              {theme}
            </span>
          </button>
          <button
            onClick={() => {
              setOpen(false)
              navigate('/settings')
            }}
            className="w-full px-3 py-2 flex items-center gap-2 text-[11px] hover:bg-accent transition-colors text-left border-t border-border/40"
          >
            <SettingsIcon className="size-3 text-muted-foreground" />
            Configurações
          </button>
          <button
            onClick={logout}
            className="w-full px-3 py-2 flex items-center gap-2 text-[11px] hover:bg-destructive/10 transition-colors text-left border-t border-border/40 text-destructive"
          >
            <LogOut className="size-3" />
            Refazer onboarding
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
