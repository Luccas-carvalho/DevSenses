import { useEffect, useState } from 'react'
import { Folder, FolderOpen, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Recent {
  path: string
  name: string
  lastOpenedAt: number
}

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

function relative(ts: number): string {
  if (!ts) return ''
  const diffMs = ts - Date.now()
  const diffMin = Math.round(diffMs / 60_000)
  if (Math.abs(diffMin) < 60) return RELATIVE_FORMATTER.format(diffMin, 'minute')
  const diffH = Math.round(diffMin / 60)
  if (Math.abs(diffH) < 24) return RELATIVE_FORMATTER.format(diffH, 'hour')
  const diffD = Math.round(diffH / 24)
  return RELATIVE_FORMATTER.format(diffD, 'day')
}

// Generates a subtle color from the folder name for the icon bg
function folderColor(name: string): string {
  const colors = [
    'bg-blue-500/15 border-blue-500/25 text-blue-400',
    'bg-violet-500/15 border-violet-500/25 text-violet-400',
    'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
    'bg-amber-500/15 border-amber-500/25 text-amber-400',
    'bg-rose-500/15 border-rose-500/25 text-rose-400',
    'bg-cyan-500/15 border-cyan-500/25 text-cyan-400'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Workspace() {
  const [recents, setRecents] = useState<Recent[]>([])
  const [loading, setLoading] = useState(true)

  async function load(): Promise<void> {
    setLoading(true)
    const r = await window.api.invoke('workspace:recent', undefined)
    setRecents(r)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function openFolder(): Promise<void> {
    // TODO: IPC — window.api.invoke('workspace:open', undefined)
    // Not yet implemented; this is a placeholder
  }

  return (
    <div className="w-full ds-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Folder className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Workspace</h1>
            <p className="text-[11px] text-muted-foreground">Pastas abertas recentemente</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={openFolder}
          className="flex-shrink-0"
        >
          <FolderOpen className="size-3.5 mr-1.5" />
          Abrir pasta
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-border/40 bg-muted/20 animate-pulse"
            />
          ))}
        </div>
      ) : recents.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-12 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center">
            <FolderOpen className="size-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/70">Nenhuma pasta aberta ainda</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Abra uma pasta de projeto para começar a analisar diffs
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={openFolder} className="mt-1">
            <Plus className="size-3.5 mr-1.5" />
            Abrir primeira pasta
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden divide-y divide-border/30">
          {recents.map((r) => {
            const colorClass = folderColor(r.name)
            return (
              <div
                key={r.path}
                className="group p-3.5 flex items-center gap-3.5 hover:bg-accent/20 transition-colors"
              >
                {/* Folder icon with color */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0',
                    colorClass
                  )}
                >
                  <Folder className="size-4" />
                </div>

                {/* Name + path */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                    {r.path}
                  </div>
                </div>

                {/* Last opened time */}
                {r.lastOpenedAt > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 flex-shrink-0">
                    <Clock className="size-3" />
                    {relative(r.lastOpenedAt)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
