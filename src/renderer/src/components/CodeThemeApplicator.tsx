import { useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import { applyAppPalette, getCodeTheme } from '@/lib/codeThemes'

export default function CodeThemeApplicator(): null {
  const { value: codeTheme } = useSettings('code_theme')
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const preset = getCodeTheme(codeTheme)
    const variant = resolvedTheme === 'dark' ? preset.dark : preset.light
    applyAppPalette(variant.app)
    document.documentElement.dataset.codeTheme = preset.id
  }, [codeTheme, resolvedTheme])

  return null
}
