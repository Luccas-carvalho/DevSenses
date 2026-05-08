import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { FileStatus, StatusKind } from '@shared/git'

interface Props {
  path: string
  files: FileStatus[]
  selectedFile: string | null
  onSelectFile: (file: string | null) => void
  onChanged: () => void
}

const STATUS_META: Record<StatusKind, { label: string; sym: string; color: string }> = {
  modified: { label: 'Modified', sym: 'M', color: 'text-amber-500' },
  added: { label: 'Added', sym: 'A', color: 'text-green-500' },
  deleted: { label: 'Deleted', sym: 'D', color: 'text-red-500' },
  renamed: { label: 'Renamed', sym: 'R', color: 'text-blue-500' },
  copied: { label: 'Copied', sym: 'C', color: 'text-blue-500' },
  untracked: { label: 'Untracked', sym: '?', color: 'text-emerald-500' },
  ignored: { label: 'Ignored', sym: '!', color: 'text-muted-foreground' },
  conflicted: { label: 'Conflicted', sym: 'U', color: 'text-destructive' }
}

function effectiveKind(f: FileStatus): StatusKind {
  return (f.staged ?? f.unstaged ?? 'modified') as StatusKind
}

function isStaged(f: FileStatus): boolean {
  return f.staged !== null && f.staged !== 'untracked'
}

export default function ChangesList({
  path,
  files,
  selectedFile,
  onSelectFile,
  onChanged
}: Props): React.ReactElement {
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    if (!filter.trim()) return files
    const q = filter.toLowerCase()
    return files.filter((f) => f.path.toLowerCase().includes(q))
  }, [files, filter])

  const allStaged = filtered.length > 0 && filtered.every(isStaged)
  const someStaged = filtered.some(isStaged)

  async function toggleAll(): Promise<void> {
    setBusy(true)
    const target = filtered.map((f) => f.path)
    if (allStaged) {
      await window.api.invoke('git:unstageFiles', { path, files: target })
    } else {
      await window.api.invoke('git:stageFiles', { path, files: target })
    }
    setBusy(false)
    onChanged()
  }

  async function toggleFile(f: FileStatus): Promise<void> {
    setBusy(true)
    if (isStaged(f)) {
      await window.api.invoke('git:unstageFiles', { path, files: [f.path] })
    } else {
      await window.api.invoke('git:stageFiles', { path, files: [f.path] })
    }
    setBusy(false)
    onChanged()
  }

  async function openInEditor(f: FileStatus): Promise<void> {
    await window.api.invoke('repository:openInEditor', { path, file: f.path })
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allStaged}
            ref={(el) => {
              if (el) el.indeterminate = someStaged && !allStaged
            }}
            onChange={toggleAll}
            disabled={busy || filtered.length === 0}
            className="size-3.5 accent-primary"
          />
          <span className="text-[11px] text-muted-foreground">
            {filtered.length} arquivo{filtered.length === 1 ? '' : 's'}
          </span>
        </label>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filtrar…"
          className="ml-auto w-28 rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic p-3">
            {filter ? 'Nada com esse filtro.' : 'Sem mudanças.'}
          </p>
        ) : (
          <ul className="py-1">
            {filtered.map((f) => {
              const kind = effectiveKind(f)
              const meta = STATUS_META[kind]
              const staged = isStaged(f)
              const isSelected = selectedFile === f.path
              return (
                <li
                  key={f.path}
                  onClick={() => onSelectFile(f.path)}
                  onDoubleClick={() => openInEditor(f)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1 cursor-pointer text-[11px] transition-colors',
                    isSelected ? 'bg-primary/10 text-foreground' : 'hover:bg-accent/40 text-foreground/85'
                  )}
                  title={`${meta.label} · duplo-clique pra abrir no editor`}
                >
                  <input
                    type="checkbox"
                    checked={staged}
                    onChange={() => toggleFile(f)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={busy}
                    className="size-3.5 accent-primary flex-shrink-0"
                  />
                  <span
                    className={cn('font-mono w-3 text-center text-[10px] flex-shrink-0', meta.color)}
                    title={meta.label}
                  >
                    {meta.sym}
                  </span>
                  <span className="truncate flex-1 font-mono">{f.path}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
