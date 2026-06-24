import { useEffect, useState } from 'react'
import { Info, Download, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

type UpdateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'not-available' }
  | { kind: 'available'; version: string }
  | { kind: 'progress'; percent: number }
  | { kind: 'downloaded'; version: string }
  | { kind: 'error'; message: string }

export default function About(): React.ReactElement {
  const [info, setInfo] = useState<{ version: string; name: string } | null>(null)
  const [update, setUpdate] = useState<UpdateState>({ kind: 'idle' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    window.api
      .invoke('app:getVersion', undefined)
      .then(setInfo)
      .catch(() => setInfo(null))

    const off = window.api.on('updater:event', (payload) => {
      const ev = payload as UpdateState & { type: string; message?: string; version?: string; percent?: number }
      switch (ev.type) {
        case 'checking':
          setUpdate({ kind: 'checking' })
          break
        case 'available':
          setUpdate({ kind: 'available', version: ev.version! })
          break
        case 'not-available':
          setUpdate({ kind: 'not-available' })
          break
        case 'progress':
          setUpdate({ kind: 'progress', percent: ev.percent ?? 0 })
          break
        case 'downloaded':
          setUpdate({ kind: 'downloaded', version: ev.version! })
          break
        case 'error':
          setUpdate({ kind: 'error', message: ev.message ?? 'erro' })
          break
      }
    })
    return off
  }, [])

  async function checkUpdates(): Promise<void> {
    setBusy(true)
    setUpdate({ kind: 'checking' })
    const res = await window.api.invoke('app:checkForUpdates', undefined)
    if (!res.ok) setUpdate({ kind: 'error', message: res.error ?? 'falhou' })
    setBusy(false)
  }

  function openRepo(): void {
    window.api.invoke('app:openExternal', { url: 'https://github.com/Luccas-carvalho/DevSenses/releases' })
  }

  return (
    <div className="w-full ds-fade-up flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <Info className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Sobre</h1>
          <p className="text-[11px] text-muted-foreground">
            Informações da instalação e atualizações
          </p>
        </div>
      </div>

      {/* ── Instalação ── */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Package className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Instalação</p>
            <p className="text-[11px] text-muted-foreground">Detalhes da build atual</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Aplicativo</span>
            <span className="text-sm font-medium">{info?.name ?? 'DevSenses'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Versão</span>
            <span className="text-sm font-mono">{info?.version ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plataforma</span>
            <span className="text-sm font-mono">{navigator.platform}</span>
          </div>
        </div>
      </div>

      {/* ── Atualizações ── */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Atualizações</p>
              <p className="text-[11px] text-muted-foreground">
                DevSenses verifica novas versões automaticamente a cada hora
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={checkUpdates} disabled={busy || update.kind === 'checking'} className="flex-shrink-0">
            <RefreshCw className={`size-3.5 mr-1.5 ${update.kind === 'checking' ? 'animate-spin' : ''}`} />
            Verificar agora
          </Button>
        </div>

        <UpdateStatus state={update} />
      </div>

      {/* ── GitHub ── */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
        <button
          onClick={openRepo}
          className="text-sm flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="size-3.5" />
          Ver releases no GitHub
        </button>
      </div>
    </div>
  )
}

function UpdateStatus({ state }: { state: UpdateState }): React.ReactElement | null {
  if (state.kind === 'idle') return null
  if (state.kind === 'checking') {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <RefreshCw className="size-3 animate-spin" /> Procurando…
      </div>
    )
  }
  if (state.kind === 'not-available') {
    return (
      <div className="text-xs text-emerald-500 flex items-center gap-2">
        <CheckCircle2 className="size-3.5" /> Você está na última versão.
      </div>
    )
  }
  if (state.kind === 'available') {
    return (
      <div className="text-xs text-primary flex items-center gap-2">
        <Download className="size-3.5" /> Versão {state.version} disponível. Baixando…
      </div>
    )
  }
  if (state.kind === 'progress') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Baixando</span>
          <span className="font-mono">{state.percent.toFixed(0)}%</span>
        </div>
        <div className="h-1 rounded-full bg-border/40 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${state.percent}%` }} />
        </div>
      </div>
    )
  }
  if (state.kind === 'downloaded') {
    return (
      <div className="text-xs text-emerald-500 flex items-center gap-2">
        <CheckCircle2 className="size-3.5" /> Versão {state.version} baixada. Reinicie pra aplicar.
      </div>
    )
  }
  return (
    <div className="text-xs text-destructive flex items-center gap-2">
      <AlertTriangle className="size-3.5" /> {state.message}
    </div>
  )
}
