import { useEffect, useState } from 'react'
import { Loader2, FileWarning, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchBlob, getCached } from '@/lib/mediaCache'

type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed'

const IMAGE_EXTS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',
  'ico',
  'avif'
])

const BINARY_EXTS = new Set([
  'icns',
  'pdf',
  'zip',
  'gz',
  'tar',
  'rar',
  '7z',
  'mp3',
  'mp4',
  'mov',
  'wav',
  'ogg',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'eot',
  'class',
  'jar',
  'so',
  'dll',
  'exe',
  'dmg',
  'bin'
])

export function getMediaKind(file: string): 'image' | 'binary' | null {
  const ext = file.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (BINARY_EXTS.has(ext)) return 'binary'
  return null
}

interface Blob {
  exists: boolean
  base64: string | null
  size: number
  mime: string | null
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function dataUrl(b: Blob): string | null {
  if (!b.base64 || !b.mime) return null
  return `data:${b.mime};base64,${b.base64}`
}

export default function MediaPreview({
  path,
  file,
  status,
  kind
}: {
  path: string
  file: string
  status: FileStatus
  kind: 'image' | 'binary'
}) {
  const wantBefore = status !== 'added'
  const wantAfter = status !== 'deleted'

  const cachedBefore = wantBefore ? getCached(path, file, 'HEAD') ?? null : null
  const cachedAfter = wantAfter ? getCached(path, file, null) ?? null : null
  const hasCachedAll =
    (!wantBefore || cachedBefore !== null) && (!wantAfter || cachedAfter !== null)

  const [before, setBefore] = useState<Blob | null>(cachedBefore)
  const [after, setAfter] = useState<Blob | null>(cachedAfter)
  const [loading, setLoading] = useState(!hasCachedAll)

  useEffect(() => {
    let cancelled = false
    const cb = wantBefore ? getCached(path, file, 'HEAD') ?? null : null
    const ca = wantAfter ? getCached(path, file, null) ?? null : null
    setBefore(cb)
    setAfter(ca)
    const allHit = (!wantBefore || cb !== null) && (!wantAfter || ca !== null)
    if (allHit) {
      setLoading(false)
      return
    }
    setLoading(true)

    Promise.all([
      wantBefore ? fetchBlob(path, file, 'HEAD') : Promise.resolve(null),
      wantAfter ? fetchBlob(path, file, null) : Promise.resolve(null)
    ])
      .then(([b, a]) => {
        if (cancelled) return
        setBefore(b)
        setAfter(a)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [path, file, status, wantBefore, wantAfter])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> carregando preview...
      </div>
    )
  }

  if (kind === 'binary') {
    return (
      <div className="p-8 flex flex-col items-center text-center gap-2 text-muted-foreground">
        <FileWarning className="size-8 opacity-50" />
        <div className="text-sm">Arquivo binário</div>
        <div className="text-[11px] font-mono">
          {before && before.exists && (
            <span className="text-red-400/80">- {formatBytes(before.size)}</span>
          )}
          {before && before.exists && after && after.exists && <span className="px-1">→</span>}
          {after && after.exists && (
            <span className="text-green-400/80">+ {formatBytes(after.size)}</span>
          )}
        </div>
        <div className="text-[11px] mt-2">
          {status === 'added' && 'Novo arquivo'}
          {status === 'deleted' && 'Arquivo removido'}
          {status === 'modified' && 'Arquivo modificado'}
          {status === 'renamed' && 'Arquivo renomeado'}
        </div>
      </div>
    )
  }

  // image
  const showSplit = status === 'modified' && before?.exists && after?.exists
  if (showSplit) {
    return (
      <div className="p-4 grid grid-cols-2 gap-4">
        <ImageCard
          label="Antes"
          tone="red"
          blob={before}
        />
        <ImageCard
          label="Depois"
          tone="green"
          blob={after}
        />
      </div>
    )
  }

  if (status === 'deleted' && before?.exists) {
    return (
      <div className="p-4">
        <ImageCard label="Removido" tone="red" blob={before} />
      </div>
    )
  }

  if ((status === 'added' || status === 'renamed') && after?.exists) {
    return (
      <div className="p-4">
        <ImageCard label="Adicionado" tone="green" blob={after} />
      </div>
    )
  }

  // fallback: tenta o que tiver
  const blob = after?.exists ? after : before?.exists ? before : null
  if (blob) {
    return (
      <div className="p-4">
        <ImageCard label="Preview" tone="neutral" blob={blob} />
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
      <ImageOff className="size-8 opacity-50" />
      <div className="text-sm">Não consegui carregar o preview</div>
    </div>
  )
}

function ImageCard({
  label,
  tone,
  blob
}: {
  label: string
  tone: 'red' | 'green' | 'neutral'
  blob: Blob | null
}) {
  const url = blob ? dataUrl(blob) : null
  return (
    <div
      className={cn(
        'rounded-lg border p-3 flex flex-col gap-2',
        tone === 'red' && 'border-red-500/30 bg-red-500/5',
        tone === 'green' && 'border-green-500/30 bg-green-500/5',
        tone === 'neutral' && 'border-border/50 bg-muted/20'
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-[10px] uppercase tracking-wider font-bold',
            tone === 'red' && 'text-red-400',
            tone === 'green' && 'text-green-400',
            tone === 'neutral' && 'text-muted-foreground'
          )}
        >
          {label}
        </span>
        {blob?.exists && (
          <span className="text-[10px] font-mono text-muted-foreground/60">
            {formatBytes(blob.size)}
          </span>
        )}
      </div>
      <div
        className="flex items-center justify-center rounded min-h-[200px] overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(45deg, rgba(127,127,127,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(127,127,127,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(127,127,127,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(127,127,127,0.12) 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
        }}
      >
        {url ? (
          <img
            src={url}
            alt={label}
            className="max-w-full max-h-[600px] object-contain"
            style={{
              imageRendering: 'auto'
            }}
          />
        ) : (
          <div className="text-[11px] text-muted-foreground p-4">
            {blob && !blob.base64 && blob.size > 0
              ? `Muito grande (${formatBytes(blob.size)})`
              : 'Sem preview'}
          </div>
        )}
      </div>
    </div>
  )
}
