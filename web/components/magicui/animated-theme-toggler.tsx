'use client'

import { useTheme } from 'next-themes'
import { Moon, SunDim } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { cn } from '@/lib/cn'

type Props = {
  className?: string
}

export function AnimatedThemeToggler({ className }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const changeTheme = async () => {
    if (!buttonRef.current) return

    const next = resolvedTheme === 'dark' ? 'light' : 'dark'

    if (!document.startViewTransition) {
      setTheme(next)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    }).ready

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const right = window.innerWidth - left
    const bottom = window.innerHeight - top
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom))

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRad}px at ${x}px ${y}px)`]
      },
      { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
    )
  }

  if (!mounted) {
    return <button ref={buttonRef} className={cn('p-2', className)} aria-hidden />
  }

  return (
    <button
      ref={buttonRef}
      onClick={changeTheme}
      className={cn('p-2 rounded-md hover:bg-muted transition-colors', className)}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <SunDim size={18} /> : <Moon size={18} />}
    </button>
  )
}
