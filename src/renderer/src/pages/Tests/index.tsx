import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Globe,
  Play,
  Loader2,
  Folder,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  History,
  Camera,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

type Intensity = 'sane' | 'chaos' | 'nuclear'

interface RunSummary {
  id: string
  ok: boolean
  baseUrl: string
  prompt: string | null
  intensity: string
  actionsCount: number
  startedAt: number
  finishedAt: number
  screenshotCount: number
  hasVideo: boolean
  folder: string
  error: string | null
}

interface RunResult {
  id: string
  ok: boolean
  baseUrl: string
  prompt: string | null
  intensity: string
  log: Array<{
    index: number
    action: string
    ok: boolean
    detail?: string
    error?: string
    ts: number
  }>
  screenshots: string[]
  videoPath: string | null
  error: string | null
  folder: string
}

const INTENSITY_OPTIONS: { value: Intensity; label: string; tip: string }[] = [
  { value: 'sane', label: 'Sane', tip: 'Caminho feliz, sem fuzz' },
  { value: 'chaos', label: 'Chaos', tip: 'Inputs aleatórios + cliques inesperados' },
  { value: 'nuclear', label: 'Nuclear', tip: 'Tudo + navegação brutal + reloads' }
]

export default function Tests() {
  const navigate = useNavigate()
  const { value: providerDefault } = useSettings('provider_default')

  const [baseUrl, setBaseUrl] = useState('http://localhost:3000')
  const [prompt, setPrompt] = useState('')
  const [intensity, setIntensity] = useState<Intensity>('sane')
  const [running, setRunning] = useState(false)
  const [agentEvents, setAgentEvents] = useState<
    { type: string; step?: number; text: string; ok?: boolean }[]
  >([])
  const [result, setResult] = useState<RunResult | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<RunSummary[]>([])
  const [historyVersion, setHistoryVersion] = useState(0)
  const [imageCache, setImageCache] = useState<Record<string, string>>({})

  // Load history
  useEffect(() => {
    window.api
      .invoke('tests:listRuns', undefined)
      .then((rows) => setHistory(rows ?? []))
      .catch(() => setHistory([]))
  }, [historyVersion])

  // Resolve image data URLs lazily as result.screenshots changes
  useEffect(() => {
    if (!result) return
    let active = true
    Promise.all(
      result.screenshots.map(async (p) => {
        if (imageCache[p]) return [p, imageCache[p]] as const
        try {
          const data = await window.api.invoke('tests:readImage', { path: p })
          return [p, data] as const
        } catch {
          return [p, ''] as const
        }
      })
    ).then((pairs) => {
      if (!active) return
      const next = { ...imageCache }
      let changed = false
      for (const [k, v] of pairs) {
        if (v && next[k] !== v) {
          next[k] = v
          changed = true
        }
      }
      if (changed) setImageCache(next)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.id])

  const canRun = !running && baseUrl.trim() && prompt.trim() && providerDefault

  async function runFlow(): Promise<void> {
    if (!canRun) return
    setError('')
    setResult(null)
    setAgentEvents([])
    setRunning(true)

    const runId = `agent-${Date.now()}`
    const off = window.api.on('tests:agentEvent', (ev) => {
      if (ev.runId !== runId) return
      setAgentEvents((prev) => {
        if (ev.type === 'thinking') {
          return [...prev, { type: 'thinking', step: ev.step, text: 'IA pensando...' }]
        }
        if (ev.type === 'snapshot') {
          return [
            ...prev,
            {
              type: 'snapshot',
              step: ev.step,
              text: `${ev.title || ev.url} · ${ev.elementsCount} elementos`
            }
          ]
        }
        if (ev.type === 'action') {
          return [
            ...prev,
            {
              type: 'action',
              step: ev.step,
              text: `${ev.action}${ev.detail ? ' — ' + ev.detail : ''}${ev.error ? ' ✗ ' + ev.error : ''}`,
              ok: ev.ok
            }
          ]
        }
        if (ev.type === 'done') {
          return [...prev, { type: 'done', text: ev.reason, ok: true }]
        }
        if (ev.type === 'fail') {
          return [...prev, { type: 'fail', text: ev.reason, ok: false }]
        }
        return prev
      })
    })

    try {
      const res = await window.api.invoke('tests:agentRun', {
        baseUrl: baseUrl.trim(),
        goal: prompt.trim(),
        intensity,
        providerId: providerDefault as string,
        runId
      })
      setResult(res as RunResult)
      setHistoryVersion((v) => v + 1)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      off()
      setRunning(false)
    }
  }

  async function loadRun(id: string): Promise<void> {
    setError('')
    const r = await window.api.invoke('tests:loadRun', { id })
    if (r) setResult(r as RunResult)
  }

  async function deleteRun(id: string, e: React.MouseEvent): Promise<void> {
    e.stopPropagation()
    await window.api.invoke('tests:deleteRun', { id })
    setHistoryVersion((v) => v + 1)
    if (result?.id === id) setResult(null)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <header
        className="h-10 flex items-stretch border-b border-border/30 bg-background/80 backdrop-blur-xl flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex-1 pl-20" aria-hidden />
        <div
          className="flex items-center gap-2 px-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => {
              if (window.history.length > 1) navigate(-1)
              else navigate('/home')
            }}
            className="flex items-center gap-1 text-xs px-2 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            voltar
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* SIDEBAR — histórico */}
        <div className="pl-2 pr-1 py-2 flex-shrink-0">
          <aside className="w-[252px] h-full flex flex-col overflow-hidden bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl border border-border/30 shadow-sm">
            <div className="px-3 py-3 border-b border-border/30 flex items-center gap-2">
              <History className="size-3.5 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Histórico
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground/60">
                {history.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground/70 p-3 text-center">
                  Sem runs ainda.
                </p>
              ) : (
                history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => loadRun(h.id)}
                    className={cn(
                      'group w-full text-left rounded-lg border p-2 transition-colors',
                      result?.id === h.id
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border/30 hover:bg-accent/40'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {h.ok ? (
                        <CheckCircle2 className="size-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="size-3.5 text-red-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium truncate text-foreground/90">
                          {h.prompt || h.baseUrl}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 truncate font-mono">
                          {h.id} · {h.screenshotCount}📷
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteRun(h.id, e)}
                        title="Apagar"
                        className="opacity-0 group-hover:opacity-100 transition-all w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>

        {/* MAIN — form + results */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Testes IA
              </h1>
              <p className="text-sm text-muted-foreground">
                Descreve o que quer testar em linguagem natural. A IA gera ações Playwright
                e o runner executa headless com screenshots.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-border/40 bg-card/40 p-4">
              <FormField label="URL base" icon={Globe}>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </FormField>

              <FormField label="O que testar?" icon={Sparkles}>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: faz login com email teste@x.com e senha 123456, depois confirma que aparece o dashboard."
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                />
              </FormField>

              <FormField label="Intensidade" icon={Zap}>
                <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
                  {INTENSITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIntensity(opt.value)}
                      title={opt.tip}
                      className={cn(
                        'flex-1 px-3 h-7 text-xs rounded transition-colors',
                        intensity === opt.value
                          ? 'bg-primary/15 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {INTENSITY_OPTIONS.find((o) => o.value === intensity)?.tip}
                </p>
              </FormField>

              <button
                onClick={runFlow}
                disabled={!canRun}
                className={cn(
                  'w-full h-10 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2',
                  canRun
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                )}
              >
                {running ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Agente IA navegando...
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    Rodar agente
                  </>
                )}
              </button>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {agentEvents.length > 0 && (
                <div className="rounded-md border border-border/40 bg-muted/30 p-2 max-h-72 overflow-y-auto space-y-1">
                  {agentEvents.map((ev, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-2 text-[11px] font-mono leading-relaxed',
                        ev.type === 'thinking' && 'text-muted-foreground italic',
                        ev.ok === false && 'text-red-400',
                        ev.type === 'done' && 'text-green-500 font-semibold',
                        ev.type === 'fail' && 'text-red-400 font-semibold'
                      )}
                    >
                      {ev.step != null && (
                        <span className="text-muted-foreground/50 flex-shrink-0">
                          [{ev.step}]
                        </span>
                      )}
                      <span className="flex-1">{ev.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result && (
              <section className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  {result.ok ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-green-500">
                      <CheckCircle2 className="size-4" />
                      Teste passou
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-red-400">
                      <XCircle className="size-4" />
                      Teste falhou
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {result.id}
                  </span>
                  <button
                    onClick={() => window.api.invoke('tests:openFolder', { path: result.folder })}
                    className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Folder className="size-3.5" />
                    abrir pasta
                  </button>
                </div>

                {result.error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                    {result.error}
                  </div>
                )}

                {/* Log */}
                {result.log.length > 0 && (
                  <ul className="rounded-lg border border-border/40 bg-card/40 divide-y divide-border/30">
                    {result.log.map((entry) => (
                      <li
                        key={entry.index}
                        className="flex items-center gap-2 px-3 py-2 text-xs"
                      >
                        {entry.ok ? (
                          <CheckCircle2 className="size-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="size-3.5 text-red-400 flex-shrink-0" />
                        )}
                        <code className="bg-muted/50 px-1.5 py-0.5 rounded text-[11px] font-mono">
                          {entry.action}
                        </code>
                        <span className="flex-1 truncate text-muted-foreground">
                          {entry.detail || entry.error}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Screenshots */}
                {result.screenshots.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <Camera className="size-3.5" />
                      Screenshots ({result.screenshots.length})
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {result.screenshots.map((p) => (
                        <ScreenshotCard
                          key={p}
                          path={p}
                          dataUrl={imageCache[p]}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function FormField({
  label,
  icon: Icon,
  children
}: {
  label: string
  icon: typeof Globe
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
        <Icon className="size-3" />
        {label}
      </label>
      {children}
    </div>
  )
}

function ScreenshotCard({ path, dataUrl }: { path: string; dataUrl: string | undefined }) {
  const name = useMemo(() => path.split('/').pop() ?? path, [path])
  return (
    <div className="rounded-md border border-border/40 overflow-hidden bg-card/40">
      {dataUrl ? (
        <img src={dataUrl} alt={name} className="block w-full h-auto" />
      ) : (
        <div className="aspect-video flex items-center justify-center text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
        </div>
      )}
      <div className="px-2 py-1 text-[10px] text-muted-foreground/70 font-mono truncate border-t border-border/30">
        {name}
      </div>
    </div>
  )
}
