import { useEffect, useRef, useState } from 'react'
import { GitBranch, Loader2, X } from 'lucide-react'

interface Props {
  path: string
  branches: string[]
  currentBranch: string
  open: boolean
  onClose: () => void
  onCreated: (name: string) => void
}

export default function NewBranchDialog({
  path,
  branches,
  currentBranch,
  open,
  onClose,
  onCreated
}: Props): React.ReactElement | null {
  const [name, setName] = useState('')
  const [base, setBase] = useState(currentBranch)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setBase(currentBranch)
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, currentBranch])

  if (!open) return null

  async function submit(): Promise<void> {
    if (!name.trim() || busy) return
    setBusy(true)
    setError('')
    const r = await window.api.invoke('git:createBranch', {
      path,
      name: name.trim(),
      baseRef: base,
      checkout: true
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.error ?? 'Falha')
      return
    }
    onCreated(name.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[420px] rounded-xl border border-border/60 bg-popover shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Nova branch</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <label className="block">
            <span className="text-[11px] text-muted-foreground">Nome</span>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="feat/minha-feature"
              disabled={busy}
              className="mt-1 w-full rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-primary/60"
            />
          </label>

          <label className="block">
            <span className="text-[11px] text-muted-foreground">Criar a partir de</span>
            <select
              value={base}
              onChange={(e) => setBase(e.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-md border border-border/60 bg-background/80 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-primary/60"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

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
            className="h-7 px-3 text-[11px] rounded-md hover:bg-accent/60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim() || busy}
            className="h-7 px-3 text-[11px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="size-3 animate-spin" />}
            Criar branch
          </button>
        </div>
      </div>
    </div>
  )
}
