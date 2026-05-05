import { useCallback, useEffect, useState } from 'react'
import type { SettingsKey, SettingsValueMap } from '@shared/settings'
import { SETTINGS_DEFAULTS } from '@shared/settings'

export function useSettings<K extends SettingsKey>(
  key: K
): {
  value: SettingsValueMap[K]
  setValue: (next: SettingsValueMap[K]) => Promise<void>
  loading: boolean
} {
  const [value, setLocal] = useState<SettingsValueMap[K]>(SETTINGS_DEFAULTS[key])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    window.api.invoke('settings:get', { key }).then((v) => {
      if (cancelled) return
      if (v !== null) setLocal(v as SettingsValueMap[K])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  const setValue = useCallback(
    async (next: SettingsValueMap[K]) => {
      await window.api.invoke('settings:set', { key, value: next })
      setLocal(next)
    },
    [key]
  )

  return { value, setValue, loading }
}
