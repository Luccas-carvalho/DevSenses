export type GitHubStats = {
  stars: number
  forks: number
  contributors: number
  releases: number
  fetchedAt: number
}

const REPO = 'Luccas-carvalho/DevSenses'
const CACHE_KEY = 'devsenses:gh-stats'
const TTL_MS = 60 * 60 * 1000 // 1h

export const FALLBACK_STATS: GitHubStats = {
  stars: 100,
  forks: 8,
  contributors: 1,
  releases: 1,
  fetchedAt: 0,
}

export function readCache(): GitHubStats | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GitHubStats
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(stats: GitHubStats) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(stats))
  } catch {
    // localStorage may be disabled (private mode); ignore
  }
}

export async function fetchGitHubStats(): Promise<GitHubStats> {
  const headers: HeadersInit = { Accept: 'application/vnd.github+json' }
  const [repoRes, contribRes, releasesRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${REPO}`, { headers }),
    fetch(`https://api.github.com/repos/${REPO}/contributors?per_page=100&anon=true`, { headers }),
    fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { headers }),
  ])

  if (!repoRes.ok) throw new Error(`GitHub repo fetch failed: ${repoRes.status}`)

  const repo = (await repoRes.json()) as { stargazers_count: number; forks_count: number }
  const contributors = contribRes.ok ? ((await contribRes.json()) as unknown[]).length : FALLBACK_STATS.contributors
  const releases = releasesRes.ok ? ((await releasesRes.json()) as unknown[]).length : FALLBACK_STATS.releases

  const stats: GitHubStats = {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    contributors,
    releases,
    fetchedAt: Date.now(),
  }
  writeCache(stats)
  return stats
}
