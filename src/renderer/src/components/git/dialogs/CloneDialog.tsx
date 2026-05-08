import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, X, FolderOpen } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onCloned: (path: string) => void
}

export default function CloneDialog({ open, onClose, onCloned }: Props): React.ReactElement | null {
  const [url, setUrl] = useState('')
  const [dest, setDest] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const urlRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUrl('')
      setDest('')
      setError('')
      setTimeout(() => urlRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  async function pickDest(): Promise<void> {
    const r = await window.api.invoke('repository:pickFolder', { title: 'Pasta destino' })
    if (r) setDest(r.path)
  }

  async function submit(): Promise<void> {
    if (!url.trim() || !dest.trim() || busy) return
    setBusy(true)
    setError('')
    const r = await window.api.invoke('git:clone', { url: url.trim(), dest: dest.trim() })
    setBusy(false)
    if (!r.ok || !r.path) {
      setError(r.error ?? 'Falha ao clonar')
      return
    }
    onCloned(r.path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[480px] rounded-xl border border-border/60 bg-popover shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Download className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Clonar repositório</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <label className="block">
            <span className="text-[11px] text-muted-foreground">URL</span>
            <input
              ref={urlRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="git@github.com:owner/repo.git"
              disabled={busy}
              className="mt-1 w-full rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-primary/60 font-mono"
            />
          </label>

          <label className="block">
            <span className="text-[11px] text-muted-foreground">Pasta destino (parent)</span>
            <div className="mt-1 flex gap-1.5">
              <input
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder="/Users/.../Github"
                disabled={busy}
                className="flex-1 rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-primary/60 font-mono"
              />
              <button
                type="button"
                onClick={pickDest}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-md border border-border/60 hover:bg-accent/60"
              >
                <FolderOpen className="size-3" />
                Pick
              </button>
            </div>
          </label>

          {error && (
            <div className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5 border border-destructive/30 max-h-32 overflow-auto whitespace-pre-wrap font-mono">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            className="h-7 px-3 text-[11px] rounded-md hover:bg-accent/60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!url.trim() || !dest.trim() || busy}
            className="h-7 px-3 text-[11px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="size-3 animate-spin" />}
            {busy ? 'Clonando…' : 'Clonar'}
          </button>
        </div>
      </div>
    </div>
  )
}
