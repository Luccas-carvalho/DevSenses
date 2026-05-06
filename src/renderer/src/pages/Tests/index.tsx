import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  Zap,
  Square,
  Video
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
  const location = useLocation()
  const projectPath = (location.state as { projectPath?: string } | null)?.projectPath
  const { value: providerDefault } = useSettings('provider_default')

  const [baseUrl, setBaseUrl] = useState('http://localhost:3000')
  const [baseUrlAutoFilled, setBaseUrlAutoFilled] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [intensity, setIntensity] = useState<Intensity>('sane')
  const [running, setRunning] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [liveFrame, setLiveFrame] = useState<string | null>(null)
  const [agentEvents, setAgentEvents] = useState<
    { type: string; step?: number; text: string; ok?: boolean }[]
  >([])
  const [result, setResult] = useState<RunResult | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<RunSummary[]>([])
  const [historyVersion, setHistoryVersion] = useState(0)
  const [imageCache, setImageCache] = useState<Record<string, string>>({})

  // Auto-detect URL: from nav state, or fallback to most recent workspace
  useEffect(() => {
    if (baseUrlAutoFilled) return
    let active = true
    ;(async () => {
      let target = projectPath
      if (!target) {
        try {
          const recent = await window.api.invoke('workspace:recent', undefined)
          target = recent?.[0]?.path
        } catch {
          // ignore
        }
      }
      if (!target) return
      try {
        const res = await window.api.invoke('tests:detectUrl', { path: target })
        if (!active) return
        if (res?.suggested) {
          setBaseUrl(res.suggested)
          setBaseUrlAutoFilled(true)
        }
      } catch {
        // ignore
      }
    })()
    return () => {
      active = false
    }
  }, [projectPath, baseUrlAutoFilled])

  // Load history
  useEffect(() => {
    window.api
      .invoke('tests:listRuns', undefined)
      .then((rows) => setHistory(rows ?? []))
      .catch(() => setHistory([]))
  }, [historyVersion])

  // Load video data URL when result has videoPath
  useEffect(() => {
    if (!result?.videoPath) {
      setVideoUrl(null)
      return
    }
    let active = true
    window.api
      .invoke('tests:readVideo', { path: result.videoPath })
      .then((url) => {
        if (active) setVideoUrl(url)
      })
      .catch(() => {
        if (active) setVideoUrl(null)
      })
    return () => {
      active = false
    }
  }, [result?.id, result?.videoPath])

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
    setLiveFrame(null)
    const off = window.api.on('tests:agentEvent', (ev) => {
      if (ev.runId !== runId) return
      if (ev.type === 'frame') {
        setLiveFrame(ev.data)
        return
      }
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
      setCancelling(false)
    }
  }

  async function cancelRun(): Promise<void> {
    if (!running || cancelling) return
    setCancelling(true)
    try {
      await window.api.invoke('tests:cancelAgent', undefined)
    } catch {
      setCancelling(false)
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

        {/* MAIN — 2 colunas: form esquerda compacto / preview+log direita big */}
        <main className="flex-1 overflow-hidden min-w-0 grid grid-cols-[360px_1fr] gap-3 p-2">
          {/* COL ESQUERDA — form */}
          <div className="overflow-auto rounded-2xl border border-border/30 bg-card/40 p-5 flex flex-col gap-4">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Testes IA
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Linguagem natural → agente Playwright executa.
              </p>
            </div>

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
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: faz login com email teste@x.com e senha 123456, depois confirma dashboard."
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
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
                      'flex-1 px-2 h-7 text-xs rounded transition-colors',
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

            <div className="mt-auto space-y-3">
              {running ? (
                <div className="flex gap-2">
                  <div className="flex-1 h-10 rounded-md bg-primary/10 border border-primary/30 text-primary text-sm font-medium flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Navegando...
                  </div>
                  <button
                    onClick={cancelRun}
                    disabled={cancelling}
                    className={cn(
                      'h-10 px-3 rounded-md font-medium text-sm transition-all flex items-center gap-1.5',
                      cancelling
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20'
                    )}
                  >
                    {cancelling ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <Square className="size-3.5" />
                        cancelar
                      </>
                    )}
                  </button>
                </div>
              ) : (
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
                  <Play className="size-4" />
                  Rodar agente
                </button>
              )}

              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-[11px] text-destructive">
                  <AlertTriangle className="size-3.5 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* COL DIREITA — preview + log */}
          <div className="overflow-hidden flex flex-col gap-3 min-w-0">
            {/* LIVE PREVIEW — chrome window */}
            <div className="flex-1 min-h-0 rounded-2xl border border-border/30 bg-black/70 dark:bg-black/90 overflow-hidden flex flex-col shadow-lg">
              <div className="h-9 flex items-center gap-2 px-3 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-500/70" />
                  <span className="size-2.5 rounded-full bg-yellow-500/70" />
                  <span className="size-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex-1 mx-3 h-5 px-2 rounded bg-white/[0.04] flex items-center text-[11px] text-white/50 font-mono truncate">
                  {result?.baseUrl || baseUrl}
                </div>
                {running && (
                  <div className="flex items-center gap-1.5 px-2 h-5 rounded bg-red-500/15 border border-red-500/30 text-[10px] text-red-400 font-mono">
                    <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden">
                {liveFrame ? (
                  <img
                    src={liveFrame}
                    alt="live preview"
                    className="block max-w-full max-h-full object-contain"
                  />
                ) : result?.screenshots[result.screenshots.length - 1] ? (
                  <img
                    src={imageCache[result.screenshots[result.screenshots.length - 1]] ?? ''}
                    alt="último screenshot"
                    className="block max-w-full max-h-full object-contain"
                  />
                ) : running ? (
                  <Loader2 className="size-6 animate-spin text-white/40" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/30">
                    <Globe className="size-8" />
                    <span className="text-xs font-mono">aguardando run</span>
                  </div>
                )}
              </div>
            </div>

            {/* EVENT LOG */}
            {(agentEvents.length > 0 || result) && (
              <div className="h-48 flex-shrink-0 rounded-2xl border border-border/30 bg-card/40 overflow-hidden flex flex-col">
                <div className="h-8 flex items-center px-3 border-b border-border/30 text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex-shrink-0">
                  agent log
                  {result && (
                    <button
                      onClick={() => window.api.invoke('tests:openFolder', { path: result.folder })}
                      className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground normal-case tracking-normal"
                    >
                      <Folder className="size-3" />
                      pasta
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 font-mono text-[11px] leading-relaxed">
                  {agentEvents.map((ev, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-2',
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
              </div>
            )}

            {/* Result status footer */}
            {result && !running && (
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-border/30 bg-card/40 text-xs">
                {result.ok ? (
                  <span className="flex items-center gap-1.5 font-semibold text-green-500">
                    <CheckCircle2 className="size-3.5" />
                    passou
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-semibold text-red-400">
                    <XCircle className="size-3.5" />
                    falhou
                  </span>
                )}
                <span className="text-muted-foreground/60 font-mono text-[10px]">{result.id}</span>
                {result.videoPath && videoUrl && (
                  <button
                    onClick={() => {
                      const w = window.open('', '_blank')
                      if (w) w.document.write(`<video src="${videoUrl}" controls autoplay style="width:100%;background:#000"></video>`)
                    }}
                    className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Video className="size-3.5" />
                    replay
                  </button>
                )}
                {result.screenshots.length > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Camera className="size-3" />
                    {result.screenshots.length}
                  </span>
                )}
              </div>
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

