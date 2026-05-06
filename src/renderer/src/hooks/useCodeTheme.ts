import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { getCodeTheme, type CodeThemePreset } from '@/lib/codeThemes'

function readResolvedTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function useCodeTheme(): {
  preset: CodeThemePreset
  resolved: 'light' | 'dark'
  variant: CodeThemePreset['light']
} {
  const { value: codeThemeId } = useSettings('code_theme')
  const [resolved, setResolved] = useState<'light' | 'dark'>(readResolvedTheme)

  useEffect(() => {
    const update = (): void => setResolved(readResolvedTheme())
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    return () => obs.disconnect()
  }, [])

  const preset = getCodeTheme(codeThemeId)
  const variant = resolved === 'dark' ? preset.dark : preset.light

  return { preset, resolved, variant }
}
