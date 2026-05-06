import { useCallback, useEffect, useState } from 'react'
import type { SettingsKey, SettingsValueMap } from '@shared/settings'
import { SETTINGS_DEFAULTS } from '@shared/settings'

const SETTINGS_EVENT = 'settings:changed'

interface SettingsChangedDetail<K extends SettingsKey = SettingsKey> {
  key: K
  value: SettingsValueMap[K]
}

function emit<K extends SettingsKey>(detail: SettingsChangedDetail<K>): void {
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail }))
}

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

  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<SettingsChangedDetail>).detail
      if (detail.key === key) {
        setLocal(detail.value as SettingsValueMap[K])
      }
    }
    window.addEventListener(SETTINGS_EVENT, handler)
    return () => window.removeEventListener(SETTINGS_EVENT, handler)
  }, [key])

  const setValue = useCallback(
    async (next: SettingsValueMap[K]) => {
      await window.api.invoke('settings:set', { key, value: next })
      setLocal(next)
      emit({ key, value: next })
    },
    [key]
  )

  return { value, setValue, loading }
}
