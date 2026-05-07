import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GitBranch, Plus, Search, Check, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Tooltip from '@/components/ui/Tooltip'
import type { BranchDetailed } from '@shared/git'

interface Props {
  path: string
  current: string
  onSwitch: (branch: string) => Promise<void>
  onCreateRequest: () => void
  refreshKey?: number
}

const RECENT_KEY_PREFIX = 'ds-recent-branches:'

function loadRecentLocal(repoPath: string): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY_PREFIX + repoPath)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function pushRecent(repoPath: string, branch: string): void {
  const cur = loadRecentLocal(repoPath)
  const next = [branch, ...cur.filter((b) => b !== branch)].slice(0, 10)
  localStorage.setItem(RECENT_KEY_PREFIX + repoPath, JSON.stringify(next))
}

function relativeTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 60) return diffMin <= 1 ? 'agora' : `${diffMin}m`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.round(diffH / 24)
  if (diffD < 30) return `${diffD}d`
  const diffM = Math.round(diffD / 30)
  if (diffM < 12) return `${diffM}mo`
  return `${Math.round(diffM / 12)}y`
}

export default function BranchSwitcher({
  path,
  current,
  onSwitch,
  onCreateRequest,
  refreshKey
}: Props): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [details, setDetails] = useState<BranchDetailed[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => loadRecentLocal(path))
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    setRecent(loadRecentLocal(path))
    window.api
      .invoke('git:recentCheckouts', { path, limit: 15 })
      .then((fromGit) => {
        if (cancelled) return
        // Reflog é fonte da verdade (já vem mais-recente-primeiro).
        // localStorage só serve enquanto reflog ainda tá carregando.
        if (fromGit.length > 0) {
          setRecent(fromGit.slice(0, 15))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [path, refreshKey])

  useEffect(() => {
    if (!open) return
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const w = 320
      const maxLeft = window.innerWidth - w - 8
      setPos({
        left: Math.max(8, Math.min(rect.left, maxLeft)),
        top: rect.bottom + 4,
        width: w
      })
    }
    setLoading(true)
    setTimeout(() => inputRef.current?.focus(), 50)
    window.api
      .invoke('git:branchesDetailed', { path })
      .then((r) => setDetails(r))
      .catch(() => setDetails([]))
      .finally(() => setLoading(false))
    const handler = (e: MouseEvent): void => {
      const t = e.target as Node
      if (
        buttonRef.current?.contains(t) ||
        popupRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, path, refreshKey])

  const grouped = useMemo(() => {
    const q = filter.toLowerCase()
    const filteredDetails = q
      ? details.filter((d) => d.name.toLowerCase().includes(q))
      : details
    const defaultCandidates = ['main', 'master', 'develop', 'dev']
    const def = filteredDetails.find((d) => defaultCandidates.includes(d.name)) ?? null
    const recentBranches = recent
      .map((name) => filteredDetails.find((d) => d.name === name))
      .filter((d): d is BranchDetailed => !!d && d.name !== def?.name)
      .slice(0, 5)
    const recentSet = new Set(recentBranches.map((b) => b.name))
    const others = filteredDetails.filter(
      (d) => d.name !== def?.name && !recentSet.has(d.name)
    )
    others.sort((a, b) => (b.lastCommitDate || '').localeCompare(a.lastCommitDate || ''))
    return { def, recentBranches, others }
  }, [details, filter, recent])

  async function pick(branch: string): Promise<void> {
    if (branch === current) {
      setOpen(false)
      return
    }
    setBusy(true)
    try {
      await onSwitch(branch)
      pushRecent(path, branch)
      // Atualiza local imediato + dispara refresh do reflog (que será fonte de verdade)
      setRecent((prev) => [branch, ...prev.filter((b) => b !== branch)].slice(0, 15))
      window.api
        .invoke('git:recentCheckouts', { path, limit: 15 })
        .then((fromGit) => {
          if (fromGit.length > 0) setRecent(fromGit.slice(0, 15))
        })
        .catch(() => {})
    } finally {
      setBusy(false)
      setOpen(false)
      setFilter('')
    }
  }

  return (
    <div ref={ref} className="relative">
      <Tooltip label={`Branch atual · ${current} · clica pra trocar`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-1.5 h-7 px-2.5 rounded-md border border-border/70 bg-background/80 text-[11px] text-foreground hover:bg-accent/60 shadow-sm"
        >
          {busy ? <Loader2 className="size-3 animate-spin flex-shrink-0" /> : <GitBranch className="size-3 flex-shrink-0" />}
          <span className="font-medium font-mono flex-1 truncate text-left">{current}</span>
          <ChevronDown className="size-3 text-muted-foreground flex-shrink-0" />
        </button>
      </Tooltip>

      {open && pos && createPortal(
        <div
          ref={popupRef}
          className="fixed rounded-md border border-border bg-popover shadow-2xl z-[2147483000] overflow-hidden flex flex-col"
          style={{ left: pos.left, top: pos.top, width: pos.width, maxHeight: 480 }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/40 flex-shrink-0">
            <Search className="size-3 text-muted-foreground" />
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar branches…"
              className="flex-1 bg-transparent text-[11px] focus:outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1 min-h-0">
            {loading ? (
              <div className="flex items-center gap-2 p-3 text-[11px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                carregando…
              </div>
            ) : (
              <>
                {grouped.def && (
                  <Section label="Branch padrão">
                    <BranchRow b={grouped.def} current={current} onPick={() => pick(grouped.def!.name)} />
                  </Section>
                )}
                {grouped.recentBranches.length > 0 && (
                  <Section label="Recentes">
                    {grouped.recentBranches.map((b) => (
                      <BranchRow key={b.name} b={b} current={current} onPick={() => pick(b.name)} />
                    ))}
                  </Section>
                )}
                {grouped.others.length > 0 && (
                  <Section label="Outras branches">
                    {grouped.others.map((b) => (
                      <BranchRow key={b.name} b={b} current={current} onPick={() => pick(b.name)} />
                    ))}
                  </Section>
                )}
                {!grouped.def && grouped.recentBranches.length === 0 && grouped.others.length === 0 && (
                  <p className="px-3 py-3 text-[11px] text-muted-foreground italic">
                    Nenhuma branch.
                  </p>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onCreateRequest()
            }}
            className="w-full flex items-center gap-1.5 px-2.5 py-2 border-t border-border/40 text-[11px] text-primary hover:bg-primary/10 flex-shrink-0"
          >
            <Plus className="size-3" />
            Nova branch
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

function Section({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div>
      <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/60">
        {label}
      </div>
      {children}
    </div>
  )
}

function BranchRow({
  b,
  current,
  onPick
}: {
  b: BranchDetailed
  current: string
  onPick: () => void
}): React.ReactElement {
  const isCurrent = b.name === current
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-left',
        isCurrent ? 'bg-primary/10' : 'hover:bg-accent/60'
      )}
    >
      {isCurrent ? (
        <Check className="size-3 text-primary flex-shrink-0" />
      ) : (
        <span className="size-3 flex-shrink-0" />
      )}
      <span className="font-mono truncate flex-1 text-foreground/90">{b.name}</span>
      <span className="text-[9px] text-muted-foreground/60 tabular-nums">
        {relativeTime(b.lastCommitDate)}
      </span>
    </button>
  )
}
