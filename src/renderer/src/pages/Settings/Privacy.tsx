import { useEffect, useState } from 'react'
import { Shield, Loader2, Lock } from 'lucide-react'
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
  const { value: notif, setValue: setNotif } = useSettings('notifications_enabled')
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
    <div className="w-full ds-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <Shield className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Privacidade & Dados</h1>
          <p className="text-[11px] text-muted-foreground">
            Controle o que é coletado localmente
          </p>
        </div>
      </div>

      {/* "Tudo local" banner */}
      <div className="rounded-xl border border-green-500/20 bg-gradient-to-r from-green-500/8 to-transparent p-3.5 mb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center flex-shrink-0">
          <Lock className="size-4 text-green-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-green-400">Tudo local</p>
          <p className="text-[11px] text-muted-foreground">
            Nenhum dado sai da sua máquina sem você ligar explicitamente.
          </p>
        </div>
      </div>

      {/* Toggle section */}
      <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">Coletar dados anônimos de uso</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Grava eventos como "abriu commit dialog", "rodou análise IA com Claude", "clicou em
              Push". <b>Nunca</b> grava conteúdo de código, nomes de arquivo, mensagens de commit
              ou caminhos. Fica salvo num SQLite local — você pode ver tudo aqui embaixo.
            </p>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={!!enabled}
            onClick={() => setEnabled(!enabled)}
            className={cn(
              'relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 mt-0.5',
              enabled ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            style={{ height: '22px', width: '40px' }}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform',
                enabled && 'translate-x-[18px]'
              )}
            />
          </button>
        </div>
      </section>

      {/* Notificações */}
      <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">Notificações</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Avisa quando uma análise ou code review termina. Fora do app vira notificação do
              sistema; com o app aberto, um aviso discreto no canto.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notif !== false}
            onClick={() => setNotif(notif === false)}
            className={cn(
              'relative flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 mt-0.5',
              notif !== false ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
            style={{ height: '22px', width: '40px' }}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform',
                notif !== false && 'translate-x-[18px]'
              )}
            />
          </button>
        </div>
      </section>

      {/* Events table */}
      <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div>
            <div className="text-sm font-medium">Eventos coletados</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {summary?.total ?? 0} eventos · {summary?.byEvent.length ?? 0} tipos distintos
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            disabled={!summary || summary.total === 0}
            className="text-[11px] px-2.5 py-1 rounded-md border border-border/50 hover:bg-accent/60 hover:border-border disabled:opacity-40 transition-colors"
          >
            Apagar tudo
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Carregando…
            </div>
          ) : !summary || summary.byEvent.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-2.5 py-10 px-4 text-center">
              <Lock className="size-6 text-muted-foreground/30" />
              <p className="text-xs font-medium text-foreground/60">Nenhum dado coletado</p>
              <p className="text-[11px] text-muted-foreground">
                {enabled
                  ? 'Nenhum evento registrado ainda.'
                  : 'A coleta está desativada no momento.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/20">
              {summary.byEvent.map((e) => (
                <li
                  key={e.event}
                  className="flex items-center gap-3 px-4 py-2.5 text-[12px] hover:bg-accent/10 transition-colors"
                >
                  <code className="font-mono text-foreground/80 flex-1 truncate text-[11px]">
                    {e.event}
                  </code>
                  <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground flex-shrink-0">
                    {e.count}×
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 w-10 text-right flex-shrink-0">
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
