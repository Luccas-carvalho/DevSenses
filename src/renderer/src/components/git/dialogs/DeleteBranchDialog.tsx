import { useEffect, useMemo, useState } from 'react'
import { Trash2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  path: string
  branches: string[]
  currentBranch: string
  open: boolean
  onClose: () => void
  onDone: () => void
}

export default function DeleteBranchDialog({
  path,
  branches,
  currentBranch,
  open,
  onClose,
  onDone
}: Props): React.ReactElement | null {
  const [picked, setPicked] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [force, setForce] = useState(false)
  const [alsoRemote, setAlsoRemote] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setPicked(null)
      setFilter('')
      setForce(false)
      setAlsoRemote(false)
      setError('')
    }
  }, [open])

  const filtered = useMemo(() => {
    const list = branches.filter((b) => b !== currentBranch)
    const q = filter.toLowerCase()
    return q ? list.filter((b) => b.toLowerCase().includes(q)) : list
  }, [branches, filter, currentBranch])

  if (!open) return null

  async function submit(): Promise<void> {
    if (!picked || busy) return
    setBusy(true)
    setError('')
    const r = await window.api.invoke('git:deleteBranch', { path, name: picked, force })
    if (!r.ok) {
      setBusy(false)
      setError(r.error ?? 'Falha')
      return
    }
    if (alsoRemote) {
      const r2 = await window.api.invoke('git:deleteBranch', { path, name: picked, remote: true })
      if (!r2.ok) {
        setBusy(false)
        setError(`Local OK, mas remote falhou:\n${r2.error ?? 'erro'}`)
        onDone()
        return
      }
    }
    setBusy(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[460px] rounded-xl border border-border bg-popover shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 text-destructive" />
            <h3 className="text-sm font-semibold">Deletar branch</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar branches…"
            className="w-full rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-primary/60"
          />
          <div className="max-h-44 overflow-y-auto rounded-md border border-border/40 bg-background/40">
            {filtered.length === 0 ? (
              <p className="p-3 text-[11px] text-muted-foreground italic">Nenhuma branch.</p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setPicked(b)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-[12px] font-mono transition-colors',
                    picked === b
                      ? 'bg-destructive/15 text-foreground'
                      : 'text-foreground/80 hover:bg-accent/60'
                  )}
                >
                  {b}
                </button>
              ))
            )}
          </div>

          <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="size-3.5 accent-destructive"
            />
            Forçar deleção (mesmo se não mergeada)
          </label>
          <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={alsoRemote}
              onChange={(e) => setAlsoRemote(e.target.checked)}
              className="size-3.5 accent-destructive"
            />
            Deletar também no remote (origin)
          </label>

          {error && (
            <div className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5 border border-destructive/30 whitespace-pre-wrap font-mono">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-7 px-3 text-[11px] rounded-md hover:bg-accent/60 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!picked || busy}
            className="h-7 px-3 text-[11px] rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="size-3 animate-spin" />}
            Deletar
          </button>
        </div>
      </div>
    </div>
  )
}
