import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDown, ArrowUp, RefreshCw, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RepoStatus } from '@shared/git'

interface Props {
  path: string
  status: RepoStatus | null
  onChanged: () => void
}

type Action = 'push' | 'pull' | 'fetch'

export default function SyncButton({ path, status, onChanged }: Props): React.ReactElement {
  const [busy, setBusy] = useState<Action | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const w = 176
      setPos({
        left: Math.max(8, rect.right - w),
        top: rect.bottom + 4,
        width: w
      })
    }
    const handler = (e: MouseEvent): void => {
      const t = e.target as Node
      if (containerRef.current?.contains(t) || popupRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const ahead = status?.ahead ?? 0
  const behind = status?.behind ?? 0
  const hasUpstream = !!status?.upstream

  async function run(action: Action): Promise<void> {
    setBusy(action)
    setError('')
    setOpen(false)
    let r: { ok: boolean; error?: string }
    if (action === 'push') {
      r = await window.api.invoke('git:push', { path, setUpstream: !hasUpstream })
    } else if (action === 'pull') {
      r = await window.api.invoke('git:pull', { path })
    } else {
      r = await window.api.invoke('git:fetch', { path, prune: true })
    }
    setBusy(null)
    if (!r.ok) {
      setError(r.error ?? 'Falha')
      setTimeout(() => setError(''), 6000)
      return
    }
    onChanged()
  }

  const primaryLabel = behind > 0 ? 'Pull' : ahead > 0 ? 'Push' : 'Fetch'
  const primaryAction: Action = behind > 0 ? 'pull' : ahead > 0 ? 'push' : 'fetch'

  return (
    <div ref={containerRef} className="relative">
      <div className="inline-flex h-7 rounded-md border border-border/60 bg-card/60 overflow-hidden">
        <button
          type="button"
          onClick={() => run(primaryAction)}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 px-2.5 text-[11px] font-medium text-foreground hover:bg-accent/60 disabled:opacity-60"
          title={!hasUpstream ? 'Branch sem upstream — Push vai criar' : `Origin: ${status?.upstream}`}
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          <span>{busy === 'push' ? 'Pushing' : busy === 'pull' ? 'Pulling' : busy === 'fetch' ? 'Fetching' : primaryLabel}</span>
          {(ahead > 0 || behind > 0) && (
            <span className="inline-flex items-center gap-1 ml-0.5 text-[10px] text-muted-foreground">
              {behind > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <ArrowDown className="size-2.5" />
                  {behind}
                </span>
              )}
              {ahead > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <ArrowUp className="size-2.5" />
                  {ahead}
                </span>
              )}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={!!busy}
          className="inline-flex items-center px-1.5 border-l border-border/60 hover:bg-accent/60 disabled:opacity-60"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>

      {error && (
        <div className="absolute right-0 top-full mt-1 text-[10px] text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1 max-w-xs whitespace-pre-wrap z-50">
          {error}
        </div>
      )}

      {open && pos && createPortal(
        <div
          ref={popupRef}
          className="fixed rounded-md border border-border bg-popover shadow-2xl z-[2147483000] overflow-hidden"
          style={{ left: pos.left, top: pos.top, width: pos.width }}
        >
          {(['push', 'pull', 'fetch'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => run(a)}
              disabled={!!busy}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-left hover:bg-accent/60 disabled:opacity-60',
                a !== 'fetch' && 'border-b border-border/40'
              )}
            >
              <span className="capitalize">{a}</span>
              {a === 'push' && ahead > 0 && (
                <span className="text-[10px] text-muted-foreground">↑{ahead}</span>
              )}
              {a === 'pull' && behind > 0 && (
                <span className="text-[10px] text-muted-foreground">↓{behind}</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
