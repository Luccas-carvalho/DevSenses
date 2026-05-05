import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ThemeMode } from '@shared/settings'

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolve(mode: ThemeMode): 'dark' | 'light' {
  if (mode !== 'auto') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface Props {
  children: ReactNode
  initialTheme?: ThemeMode
}

export function ThemeProvider({ children, initialTheme = 'auto' }: Props) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => resolve(initialTheme))

  useEffect(() => {
    let cancelled = false
    window.api
      .invoke('settings:get', { key: 'theme' })
      .then((stored) => {
        if (cancelled) return
        if (stored === 'dark' || stored === 'light' || stored === 'auto') {
          setThemeState(stored)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const next = resolve(theme)
    setResolvedTheme(next)
    document.documentElement.dataset.theme = next
  }, [theme])

  useEffect(() => {
    if (theme !== 'auto') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (): void => {
      const next = mql.matches ? 'dark' : 'light'
      setResolvedTheme(next)
      document.documentElement.dataset.theme = next
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve estar dentro de <ThemeProvider>')
  return ctx
}
