import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import {
  PROVIDER_IDS,
  type ProviderId,
  type ProviderStatus,
  PROVIDER_META
} from '@shared/providers'
import { Button } from '@/components/ui/button'
import {
  Loader2, RefreshCw, ChevronDown, Bot, Zap, Check, X,
  ExternalLink, CheckCircle2, AlertCircle, FlaskConical
} from 'lucide-react'
import { PROVIDER_MODELS, DEFAULT_MODEL } from '@/lib/providerModels'
import { cn } from '@/lib/utils'

const CACHE_KEY = 'providers_cache_v1'

function loadCache(): Record<ProviderId, ProviderStatus> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function AI() {
  const { value: defaultId, setValue: setDefault } = useSettings('provider_default')
  const { value: model, setValue: setModel } = useSettings('provider_model')
  const [status, setStatus] = useState<Record<ProviderId, ProviderStatus> | null>(loadCache)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState<ProviderId | null>(null)
  const [testResult, setTestResult] = useState<{ id: ProviderId; ok: boolean; msg: string } | null>(null)
  const [modelOpen, setModelOpen] = useState(false)

  async function detect(): Promise<void> {
    setLoading(true)
    const r = await window.api.invoke('providers:detect', undefined)
    setStatus(r)
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(r))
    } catch {
      // storage full / unavailable — non-critical
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!status) detect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function retest(id: ProviderId): Promise<void> {
    setTesting(id)
    setTestResult(null)
    const r = await window.api.invoke('providers:test', { id })
    setTesting(null)
    if (r.ok) {
      setTestResult({ id, ok: true, msg: `Respondeu em ${(r.latencyMs / 1000).toFixed(1)}s` })
    } else {
      setTestResult({ id, ok: false, msg: r.error ?? 'Falha na conexão' })
    }
  }

  const selectedModels = defaultId ? PROVIDER_MODELS[defaultId] ?? [] : []
  const currentModelLabel =
    selectedModels.find((m) => m.id === model)?.label ?? model ?? 'selecionar modelo'

  function handleSelectProvider(id: ProviderId): void {
    setDefault(id)
    setTestResult(null)
    const list = PROVIDER_MODELS[id] ?? []
    if (!list.some((m) => m.id === model)) {
      setModel(DEFAULT_MODEL[id] ?? list[0]?.id ?? '')
    }
  }

  const installedCount = status
    ? PROVIDER_IDS.filter((id) => status[id]?.installed).length
    : null

  const selectedMeta = defaultId ? PROVIDER_META[defaultId] : null
  const selectedStatus = defaultId ? status?.[defaultId] : null
  const showModelDropdown = defaultId && selectedStatus?.installed && selectedModels.length > 0

  return (
    <div className="w-full ds-fade-up flex flex-col gap-5 min-h-0">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Bot className="size-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Inteligência Artificial</h1>
              {installedCount !== null && (
                <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium">
                  {installedCount} instalado{installedCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Providers detectados automaticamente no PATH
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={detect} disabled={loading} className="flex-shrink-0">
          {loading ? (
            <Loader2 className="size-3.5 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="size-3.5 mr-1.5" />
          )}
          Reescanear
        </Button>
      </div>

      {/* ── 2-col layout ── */}
      <div className="grid grid-cols-[260px_1fr] gap-4 min-h-0">

        {/* Left: provider list */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium px-1 mb-1">
            Providers
          </p>

          {PROVIDER_IDS.map((id) => {
            const meta = PROVIDER_META[id]
            const st = status?.[id]
            const isInstalled = st?.installed
            const isSelected = defaultId === id

            return (
              <button
                key={id}
                type="button"
                disabled={!isInstalled}
                onClick={() => handleSelectProvider(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'border-primary/40 bg-primary/8 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.25)]'
                    : isInstalled
                      ? 'border-border/50 bg-card/60 hover:border-border hover:bg-card/80 cursor-pointer'
                      : 'border-border/30 bg-muted/10 opacity-50 cursor-not-allowed'
                )}
              >
                {/* Status dot */}
                <div
                  className={cn(
                    'size-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isInstalled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : isInstalled ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-[13px] font-medium truncate', isSelected && 'text-primary')}>
                      {meta.label}
                    </span>
                    {st?.version && (
                      <span className="text-[10px] font-mono text-muted-foreground/60 flex-shrink-0">
                        v{st.version}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <span className="size-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            )
          })}

          {/* Hint */}
          <div className="mt-2 rounded-lg border border-border/30 bg-muted/10 px-3 py-2.5 flex items-start gap-2">
            <Zap className="size-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Selecione um instalado para definir como padrão do Diff Reviewer.
            </p>
          </div>
        </div>

        {/* Right: selected provider config */}
        <div className="flex flex-col gap-3">
          {!defaultId || !selectedMeta ? (
            <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/5 p-8">
              <p className="text-[12px] text-muted-foreground">
                Selecione um provider instalado
              </p>
            </div>
          ) : (
            <>
              {/* Provider info card */}
              <div className={cn(
                'rounded-xl border p-4',
                selectedStatus?.installed
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/40 bg-card/60'
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{selectedMeta.label}</p>
                      {selectedStatus?.version && (
                        <span className="text-[10px] font-mono text-muted-foreground/70">
                          v{selectedStatus.version}
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          selectedStatus?.installed
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-muted/60 text-muted-foreground'
                        )}
                      >
                        {selectedStatus?.installed ? 'instalado' : 'não instalado'}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{selectedMeta.description}</p>
                  </div>

                  {/* Test button */}
                  {selectedStatus?.installed && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 h-8 text-[11px]"
                      onClick={() => retest(defaultId)}
                      disabled={testing !== null}
                    >
                      {testing === defaultId ? (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      ) : (
                        <FlaskConical className="size-3.5 mr-1.5" />
                      )}
                      {testing === defaultId ? 'Testando…' : 'Testar'}
                    </Button>
                  )}

                  {!selectedStatus?.installed && (
                    <a
                      href={selectedMeta.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline flex-shrink-0"
                    >
                      Instalar <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                {/* Test result inline */}
                {testResult && testResult.id === defaultId && (
                  <div
                    className={cn(
                      'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]',
                      testResult.ok
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-destructive/10 border border-destructive/20 text-destructive'
                    )}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="size-3.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="size-3.5 flex-shrink-0" />
                    )}
                    {testResult.msg}
                  </div>
                )}
              </div>

              {/* Model picker */}
              {showModelDropdown && (
                <div className="rounded-xl border border-border/40 bg-card/60 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-2">
                    Modelo
                  </p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setModelOpen((o) => !o)}
                      className="w-full flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors px-3 h-9 text-sm"
                    >
                      <span className="font-medium truncate">{currentModelLabel}</span>
                      <ChevronDown
                        className={cn(
                          'size-3.5 text-muted-foreground transition-transform flex-shrink-0',
                          modelOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    {modelOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setModelOpen(false)}
                          aria-hidden
                        />
                        <div className="absolute left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                          {selectedModels.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setModel(m.id)
                                setModelOpen(false)
                              }}
                              className={cn(
                                'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                                m.id === model && 'bg-primary/10 text-primary'
                              )}
                            >
                              <span className="truncate">{m.label}</span>
                              {m.tag && (
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 flex-shrink-0">
                                  {m.tag}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
