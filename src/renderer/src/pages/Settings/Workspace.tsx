import { useEffect, useState } from 'react'
import { Folder } from 'lucide-react'

interface Recent {
  path: string
  name: string
  lastOpenedAt: number
}

export default function Workspace() {
  const [recents, setRecents] = useState<Recent[]>([])

  async function load(): Promise<void> {
    const r = await window.api.invoke('workspace:recent', undefined)
    setRecents(r)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Workspace</h1>

      <h2 className="text-sm font-medium mb-2">Pastas recentes</h2>
      {recents.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pasta aberta ainda.</p>}
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {recents.map((r) => (
          <div key={r.path} className="p-3 flex items-center gap-3">
            <Folder className="size-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{r.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{r.path}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
