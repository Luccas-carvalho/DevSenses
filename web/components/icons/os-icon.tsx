export type Os = 'macos' | 'linux' | 'windows'

const REPO = 'Luccas-carvalho/DevSenses'
/** Página da última release (fallback que sempre funciona, sem JS). */
export const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`

export const OS_ASSETS: Record<Os, { ext: string; match: (name: string) => boolean }> = {
  macos: { ext: '.dmg', match: (n) => n.endsWith('.dmg') },
  linux: { ext: '.AppImage', match: (n) => n.endsWith('.appimage') },
  windows: { ext: '.exe', match: (n) => n.endsWith('.exe') }
}

interface GithubAsset {
  name: string
  browser_download_url: string
}

/**
 * Resolve a URL de download direto do instalador da ÚLTIMA release pro SO dado,
 * lendo a API do GitHub (independe da versão no nome do arquivo). Cai pra página
 * de releases se a API falhar ou não houver asset do SO.
 */
export async function resolveDownload(os: Os): Promise<string> {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' }
    })
    if (!r.ok) return RELEASES_PAGE
    const data: { assets?: GithubAsset[] } = await r.json()
    const match = OS_ASSETS[os].match
    const candidates = (data.assets ?? []).filter((a) => match(a.name.toLowerCase()))
    if (candidates.length === 0) return RELEASES_PAGE
    // macOS: prefere o build arm64 (Apple Silicon) quando houver mais de um .dmg.
    if (os === 'macos') {
      const arm = candidates.find((a) => /arm64|aarch64/i.test(a.name))
      return (arm ?? candidates[0]).browser_download_url
    }
    return candidates[0].browser_download_url
  } catch {
    return RELEASES_PAGE
  }
}

/** Handler de clique: tenta o asset direto; se não, segue o href (página de releases). */
export async function onDownloadClick(os: Os, e: { preventDefault: () => void }): Promise<void> {
  e.preventDefault()
  const url = await resolveDownload(os)
  window.location.href = url
}

export function detectOs(): Os | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/Win/i.test(ua)) return 'windows'
  if (/Mac/i.test(ua)) return 'macos'
  if (/Linux|X11/i.test(ua)) return 'linux'
  return 'macos'
}

export function OsIcon({ os, size = 24 }: { os: Os; size?: number }) {
  if (os === 'macos') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d="M17.05 12.04c-.02-2.18 1.78-3.22 1.86-3.28-1.01-1.48-2.59-1.68-3.16-1.71-1.34-.14-2.62.79-3.3.79-.68 0-1.74-.77-2.86-.75-1.47.02-2.83.85-3.59 2.16-1.53 2.65-.39 6.58 1.1 8.74.73 1.05 1.6 2.24 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.33 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.14.84-1.23 1.18-2.42 1.2-2.49-.03-.01-2.3-.88-2.33-3.5zM14.91 5.51c.6-.73 1-1.74.89-2.75-.86.04-1.91.58-2.53 1.3-.55.64-1.04 1.68-.91 2.67.96.07 1.95-.49 2.55-1.22z" />
      </svg>
    )
  }
  if (os === 'windows') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d="M3 5.5l8-1.1v8.3H3zm8 8.3v8.3l-8-1.1v-7.2zm1.4-9.6L22 3v9.7h-9.6zm9.6 9.7V22l-9.6-1.3v-7z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M12.5 2c-2.5 0-3.6 2-3.5 4.5.1 1.7-.4 2.8-1.3 3.9-1.1 1.3-1.7 2.6-1.7 4.1 0 1.1.3 2 .6 2.7-.4.3-.7.7-.7 1.2 0 .8.5 1.1 1.4 1.5.6.3.8.6 1 1.1.4 1 .9 1 2.7 1 1.4 0 2-.2 2.5-.7.5.5 1.1.7 2.5.7 1.8 0 2.3 0 2.7-1 .2-.5.4-.8 1-1.1.9-.4 1.4-.7 1.4-1.5 0-.5-.3-.9-.7-1.2.3-.7.6-1.6.6-2.7 0-1.5-.6-2.8-1.7-4.1-.9-1.1-1.4-2.2-1.3-3.9.1-2.5-1-4.5-3.5-4.5zm-.5 3c.7 0 1.3.7 1.3 1.5S12.7 8 12 8s-1.3-.7-1.3-1.5S11.3 5 12 5zm-1.8 2.5c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7zm3.6 0c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7zM12 10c1 0 2 .8 2 1.5s-1 1-2 1-2-.3-2-1S11 10 12 10z" />
    </svg>
  )
}
