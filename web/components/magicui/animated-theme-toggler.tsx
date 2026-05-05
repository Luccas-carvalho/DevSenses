'use client'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { cn } from '@/lib/utils'

export function AnimatedThemeToggler({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const ref = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const toggle = async () => {
    if (!ref.current) return
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    if (!document.startViewTransition) { setTheme(next); return }
    const { top, left, width, height } = ref.current.getBoundingClientRect()
    const x = left + width / 2; const y = top + height / 2
    const maxRad = Math.hypot(Math.max(left, window.innerWidth - left), Math.max(top, window.innerHeight - top))
    await document.startViewTransition(() => { flushSync(() => setTheme(next)) }).ready
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRad}px at ${x}px ${y}px)`] },
      { duration: 600, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
    )
  }

  if (!mounted) return <button ref={ref} className={cn('p-2', className)} />
  return (
    <button ref={ref} onClick={toggle} aria-label="Toggle theme"
      className={cn('p-2 rounded-md hover:bg-accent transition-colors', className)}>
      {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
