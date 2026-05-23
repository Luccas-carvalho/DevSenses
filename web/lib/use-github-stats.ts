'use client'
import { useEffect, useState } from 'react'
import { FALLBACK_STATS, fetchGitHubStats, readCache, type GitHubStats } from './github-stats'

export function useGitHubStats() {
  const [stats, setStats] = useState<GitHubStats>(() => readCache() ?? FALLBACK_STATS)
  const [loaded, setLoaded] = useState<boolean>(() => readCache() !== null)

  useEffect(() => {
    if (loaded) return
    let cancelled = false
    fetchGitHubStats()
      .then((s) => {
        if (!cancelled) {
          setStats(s)
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [loaded])

  return stats
}
