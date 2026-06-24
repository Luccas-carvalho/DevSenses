/**
 * Check de atualização via GitHub Releases — sem depender de assinatura.
 *
 * O electron-updater (updater.ts) faz auto-update silencioso no Win/Linux, mas no
 * macOS SEM Developer ID ele não consegue aplicar o pacote. Então aqui consultamos
 * a release mais recente, comparamos a versão e, se houver nova, o modal oferece
 * baixar o instalador DENTRO do app (com progresso) e abre no fim — no mac o
 * usuário arrasta pra Applications. Best-effort: offline/rate-limit → "sem update".
 */
import { createWriteStream } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import type { UpdateInfo } from '../shared/ipc-contract'

const REPO = 'Luccas-carvalho/DevSenses'
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`

function parseSemver(v: string): [number, number, number] {
  const p = v
    .replace(/^v/i, '')
    .split(/[.+-]/)
    .map((n) => parseInt(n, 10) || 0)
  return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0]
}

export function isNewerVersion(latest: string, current: string): boolean {
  const a = parseSemver(latest)
  const b = parseSemver(current)
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return false
}

interface GithubRelease {
  tag_name?: string
  body?: string
  html_url?: string
  published_at?: string
  draft?: boolean
  prerelease?: boolean
  assets?: Array<{ name: string; browser_download_url: string }>
}

/** Escolhe o instalador do SO atual: mac .dmg (arch), win .exe, linux .AppImage. */
function pickAsset(assets: GithubRelease['assets']): string | null {
  const list = assets ?? []
  const lower = (n: string): string => n.toLowerCase()
  if (process.platform === 'darwin') {
    const byArch = list.find(
      (a) => lower(a.name).endsWith('.dmg') && lower(a.name).includes(process.arch)
    )
    const anyDmg = list.find((a) => lower(a.name).endsWith('.dmg'))
    return byArch?.browser_download_url ?? anyDmg?.browser_download_url ?? null
  }
  const ext = process.platform === 'win32' ? '.exe' : '.appimage'
  return list.find((a) => lower(a.name).endsWith(ext))?.browser_download_url ?? null
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  const currentVersion = app.getVersion()
  const none: UpdateInfo = {
    hasUpdate: false,
    currentVersion,
    latestVersion: null,
    notes: null,
    url: null,
    htmlUrl: null,
    publishedAt: null
  }
  try {
    const res = await fetch(RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevSenses-Updater',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      signal: AbortSignal.timeout(8000)
    })
    if (!res.ok) return none
    const rel = (await res.json()) as GithubRelease
    if (!rel?.tag_name || rel.draft || rel.prerelease) return none
    const latestVersion = rel.tag_name.replace(/^v/i, '')
    return {
      hasUpdate: isNewerVersion(latestVersion, currentVersion),
      currentVersion,
      latestVersion,
      notes: rel.body?.trim() || null,
      url: pickAsset(rel.assets) ?? rel.html_url ?? null,
      htmlUrl: rel.html_url ?? null,
      publishedAt: rel.published_at ?? null
    }
  } catch {
    return none
  }
}

/** Baixa o instalador pro ~/Downloads com progresso e devolve o caminho. */
export async function downloadUpdateInstaller(
  url: string,
  onProgress: (percent: number) => void
): Promise<string> {
  const filename = url.split('/').pop()?.split('?')[0] || 'DevSenses-update'
  const dest = join(app.getPath('downloads'), filename)
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10 * 60 * 1000) })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
  const total = Number(res.headers.get('content-length')) || 0
  let received = 0
  const file = createWriteStream(dest)
  try {
    const reader = res.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      file.write(Buffer.from(value))
      received += value.length
      if (total) onProgress(Math.min(99, Math.round((received / total) * 100)))
    }
  } finally {
    await new Promise<void>((resolve) => file.end(() => resolve()))
  }
  return dest
}
