import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { ProviderCard } from '@/components/ProviderCard'
import {
  PROVIDER_IDS,
  type ProviderId,
  type ProviderStatus,
  PROVIDER_META
} from '@shared/providers'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, ChevronDown } from 'lucide-react'
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

  // Only scan on mount if cache is missing
  useEffect(() => {
    if (!status) detect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function retest(id: ProviderId): Promise<void> {
    setTesting(id)
    const r = await window.api.invoke('providers:test', { id })
    setTesting(null)
    if (r.ok) {
      window.alert(
        `✓ ${PROVIDER_META[id].label} respondeu em ${(r.latencyMs / 1000).toFixed(1)}s`
      )
    } else {
      window.alert(`✗ ${PROVIDER_META[id].label} falhou: ${r.error}`)
    }
  }

  const selectedModels = defaultId ? PROVIDER_MODELS[defaultId] ?? [] : []
  const currentModelLabel =
    selectedModels.find((m) => m.id === model)?.label ?? model ?? 'selecionar modelo'

  function handleSelectProvider(id: ProviderId): void {
    setDefault(id)
    // Reset model to default for that provider if current model isn't valid
    const list = PROVIDER_MODELS[id] ?? []
    if (!list.some((m) => m.id === model)) {
      setModel(DEFAULT_MODEL[id] ?? list[0]?.id ?? '')
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">IA</h1>
        <Button variant="ghost" size="sm" onClick={detect} disabled={loading}>
          {loading ? (
            <Loader2 className="size-3.5 animate-spin mr-1" />
          ) : (
            <RefreshCw className="size-3.5 mr-1" />
          )}
          Reescanear
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        CLI padrão usada pelo Diff Reviewer. Clica numa instalada pra setar como padrão.
      </p>

      <div className="grid gap-2">
        {PROVIDER_IDS.map((id) => {
          const isSelected = defaultId === id
          const isInstalled = status?.[id]?.installed
          const showModelDropdown = isSelected && isInstalled && selectedModels.length > 0
          return (
            <div key={id} className="flex items-start gap-2">
              <div className="flex-1">
                <ProviderCard
                  id={id}
                  status={status?.[id]}
                  loading={loading}
                  selected={isSelected}
                  onSelect={() => handleSelectProvider(id)}
                >
                  {showModelDropdown && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setModelOpen((o) => !o)}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors px-3 h-9 text-sm'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex-shrink-0">
                            modelo
                          </span>
                          <span className="font-medium truncate">{currentModelLabel}</span>
                        </div>
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
                          <div className="absolute left-0 right-0 mt-1 z-50 rounded-md border border-border bg-popover shadow-xl overflow-hidden">
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
                  )}
                </ProviderCard>
              </div>
              {isInstalled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => retest(id)}
                  disabled={testing !== null}
                >
                  {testing === id ? <Loader2 className="size-3 animate-spin" /> : 'Testar'}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
