import { useEffect, useMemo, useRef, useState } from 'react'
import { GitBranch, Plus, Search, Check, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  path: string
  branches: string[]
  current: string
  baseBranch?: string
  onSwitch: (branch: string) => Promise<void>
  onCreateRequest: () => void
}

export default function BranchSwitcher({
  branches,
  current,
  baseBranch,
  onSwitch,
  onCreateRequest
}: Props): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 50)
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const grouped = useMemo(() => {
    const q = filter.toLowerCase()
    const filtered = q ? branches.filter((b) => b.toLowerCase().includes(q)) : branches
    const def = baseBranch && filtered.includes(baseBranch) ? baseBranch : null
    const others = filtered.filter((b) => b !== def)
    return { def, others }
  }, [branches, filter, baseBranch])

  async function pick(branch: string): Promise<void> {
    if (branch === current) {
      setOpen(false)
      return
    }
    setBusy(true)
    try {
      await onSwitch(branch)
    } finally {
      setBusy(false)
      setOpen(false)
      setFilter('')
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border/60 bg-card/60 text-[11px] text-foreground hover:bg-accent/60"
      >
        {busy ? <Loader2 className="size-3 animate-spin" /> : <GitBranch className="size-3" />}
        <span className="font-medium max-w-[180px] truncate">{current}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 rounded-md border border-border bg-popover shadow-2xl z-[200] overflow-hidden">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/40">
            <Search className="size-3 text-muted-foreground" />
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar branches…"
              className="flex-1 bg-transparent text-[11px] focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {grouped.def && (
              <>
                <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/60">
                  Default
                </div>
                <BranchItem
                  branch={grouped.def}
                  current={current}
                  onPick={() => pick(grouped.def!)}
                />
              </>
            )}
            {grouped.others.length > 0 && (
              <>
                <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/60 mt-1">
                  Branches
                </div>
                {grouped.others.map((b) => (
                  <BranchItem key={b} branch={b} current={current} onPick={() => pick(b)} />
                ))}
              </>
            )}
            {grouped.others.length === 0 && !grouped.def && (
              <p className="px-3 py-2 text-[11px] text-muted-foreground italic">
                Nenhuma branch.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onCreateRequest()
            }}
            className="w-full flex items-center gap-1.5 px-2.5 py-2 border-t border-border/40 text-[11px] text-primary hover:bg-primary/10"
          >
            <Plus className="size-3" />
            Nova branch
          </button>
        </div>
      )}
    </div>
  )
}

function BranchItem({
  branch,
  current,
  onPick
}: {
  branch: string
  current: string
  onPick: () => void
}): React.ReactElement {
  const isCurrent = branch === current
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-left',
        isCurrent ? 'bg-primary/10 text-foreground' : 'hover:bg-accent/60 text-foreground/85'
      )}
    >
      {isCurrent ? (
        <Check className="size-3 text-primary flex-shrink-0" />
      ) : (
        <span className="size-3 flex-shrink-0" />
      )}
      <span className="font-mono truncate flex-1">{branch}</span>
    </button>
  )
}
