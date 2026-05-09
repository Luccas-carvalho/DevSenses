import { useEffect, useState } from 'react'

export type Mastery = { level: number; correct: number; wrong: number } | null

export function useConceptMastery(names: string[]): Record<string, Mastery> {
  const [map, setMap] = useState<Record<string, Mastery>>({})
  const key = names.join('|')

  useEffect(() => {
    if (names.length === 0) {
      setMap({})
      return
    }
    let cancelled = false
    window.api
      .invoke('concepts:masteryBatch', { names })
      .then((res) => {
        if (!cancelled) setMap(res)
      })
      .catch(() => {
        if (!cancelled) setMap({})
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return map
}
