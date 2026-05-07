import { useEffect, useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

interface Summary {
  total: number
  enabled: boolean
  byEvent: Array<{ event: string; count: number; lastSeen: number }>
}

function relativeTime(ts: number): string {
  if (!ts) return ''
  const diffMs = Date.now() - ts
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.round(diffH / 24)
  return `${diffD}d`
}

export default function Privacy(): React.ReactElement {
  const { value: enabled, setValue: setEnabled } = useSettings('telemetry_enabled')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    setLoading(true)
    window.api
      .invoke('telemetry:summary', undefined)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [version, enabled])

  async function clear(): Promise<void> {
    if (!confirm('Apagar todos eventos coletados?')) return
    await window.api.invoke('telemetry:clear', undefined)
    setVersion((v) => v + 1)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="size-4 text-primary" />
        <h1 className="text-2xl font-semibold">Privacidade & Dados</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        Tudo fica local na sua máquina por padrão. Nada sai pro servidor sem você ligar.
      </p>

      <section className="rounded-xl border border-border/60 bg-card p-4 mb-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4 accent-primary mt-0.5"
          />
          <div className="flex-1">
            <div className="text-sm font-medium">Coletar dados anônimos de uso</div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Grava eventos como "abriu commit dialog", "rodou análise IA com Claude", "clicou em
              Push". <b>Nunca</b> grava conteúdo de código, nomes de arquivo, mensagens de commit
              ou caminhos. Fica salvo num SQLite local — você pode ver tudo aqui embaixo.
            </p>
          </div>
        </label>
      </section>

      <section className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
          <div>
            <div className="text-sm font-medium">Eventos coletados</div>
            <div className="text-[10px] text-muted-foreground">
              {summary?.total ?? 0} eventos · {summary?.byEvent.length ?? 0} tipos distintos
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={!summary || summary.total === 0}
            className="text-[11px] px-2 py-1 rounded-md border border-border hover:bg-accent/60 disabled:opacity-40"
          >
            Apagar tudo
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 p-3 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              carregando…
            </div>
          ) : !summary || summary.byEvent.length === 0 ? (
            <p className="p-4 text-[11px] text-muted-foreground italic">
              Nenhum evento coletado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border/30">
              {summary.byEvent.map((e) => (
                <li
                  key={e.event}
                  className="flex items-center gap-3 px-4 py-2 text-[12px]"
                >
                  <code className="font-mono text-foreground/85 flex-1 truncate">{e.event}</code>
                  <span className={cn('tabular-nums', 'text-muted-foreground')}>
                    {e.count}×
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 w-12 text-right">
                    {relativeTime(e.lastSeen)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
