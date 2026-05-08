import { useEffect, useRef, useState } from 'react'
import { Pencil, Loader2, X } from 'lucide-react'

interface Props {
  path: string
  oldName: string
  open: boolean
  onClose: () => void
  onDone: () => void
}

export default function RenameBranchDialog({
  path,
  oldName,
  open,
  onClose,
  onDone
}: Props): React.ReactElement | null {
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setNewName(oldName)
      setError('')
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [open, oldName])

  if (!open) return null

  async function submit(): Promise<void> {
    if (!newName.trim() || newName === oldName || busy) return
    setBusy(true)
    setError('')
    const r = await window.api.invoke('git:renameBranch', {
      path,
      oldName,
      newName: newName.trim()
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.error ?? 'Falha')
      return
    }
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[420px] rounded-xl border border-border bg-popover shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Pencil className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Renomear branch</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-[11px] text-muted-foreground">
            Renomear <code className="bg-muted px-1 rounded font-mono">{oldName}</code> para:
          </div>
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            disabled={busy}
            className="w-full rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-primary/60 font-mono"
          />
          {error && (
            <div className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5 border border-destructive/30">
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
            disabled={!newName.trim() || newName === oldName || busy}
            className="h-7 px-3 text-[11px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="size-3 animate-spin" />}
            Renomear
          </button>
        </div>
      </div>
    </div>
  )
}
