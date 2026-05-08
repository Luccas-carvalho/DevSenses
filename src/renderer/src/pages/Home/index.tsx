import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Folder,
  Settings as SettingsIcon,
  FolderOpen,
  Clock,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Sparkles
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import type { ThemeMode } from '@shared/settings'
import { cn } from '@/lib/utils'
import Logo from '@/components/Logo'
import Tooltip from '@/components/ui/Tooltip'

interface Recent {
  path: string
  name: string
  lastOpenedAt: number
}

const THEME_OPTIONS: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Claro' },
  { value: 'dark', icon: Moon, label: 'Escuro' },
  { value: 'auto', icon: Monitor, label: 'Sistema' }
]

function ThemeIconToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border/40 bg-muted/40 p-0.5">
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value} label={`Tema · ${label}`}>
          <button
            onClick={() => {
              setTheme(value)
              window.api.invoke('settings:set', { key: 'theme', value })
            }}
            className={cn(
              'flex items-center justify-center w-7 h-6 rounded transition-colors',
              theme === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-3.5" />
          </button>
        </Tooltip>
      ))}
    </div>
  )
}

export default function Home() {
  const { value: name } = useSettings('user_name')
  const navigate = useNavigate()
  const [recents, setRecents] = useState<Recent[]>([])

  useEffect(() => {
    window.api.invoke('workspace:recent', undefined).then(setRecents)
  }, [])

  // Dock menu opens project
  useEffect(() => {
    return window.api.on('app:open-project', (event) => {
      if (event.path) navigate(`/project?path=${encodeURIComponent(event.path)}`)
    })
  }, [navigate])

  useEffect(() => {
    return window.api.on('menu:action', (event) => {
      const a = event.action
      if (a === 'open-settings') navigate('/settings')
      else if (a === 'open-local') pick()
      else if (a === 'go-home') navigate('/home')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  useEffect(() => {
    window.api.invoke('menu:setState', {
      hasProject: false,
      branchName: null,
      onBranch: false,
      onDetachedHead: false,
      branchIsUnborn: false,
      onNonDefaultBranch: false,
      hasPublishedBranch: false,
      hasRemote: false,
      isHostedOnGitHub: false,
      hasChangedFiles: false,
      hasStaged: false,
      hasMultipleBranches: false,
      hasConflicts: false,
      rebaseInProgress: false,
      isMerging: false,
      networkInProgress: false,
      branchHasStash: false,
      hasContributionTargetDefaultBranch: false,
      onContributionTargetDefaultBranch: false,
      isAhead: false,
      isBehind: false
    })
  }, [])

  async function pick(): Promise<void> {
    const r = await window.api.invoke('workspace:pickFolder', undefined)
    if (r) {
      const next = await window.api.invoke('workspace:recent', undefined)
      setRecents(next)
      navigate(`/project?path=${encodeURIComponent(r.path)}`)
    }
  }

  const ambientDust = useMemo(() => {
    const arr: Array<{ x: number; y: number; size: number; delay: number }> = []
    for (let i = 0; i < 50; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 1.8,
        delay: Math.random() * 5
      })
    }
    return arr
  }, [])

  return (
    <div className="ds-home-root h-full flex flex-col relative overflow-hidden">
      {/* Ambient cosmic background */}
      <div className="ds-home-bg" aria-hidden>
        <div className="ds-home-aurora ds-home-aurora-1" />
        <div className="ds-home-aurora ds-home-aurora-2" />
        <div className="ds-home-aurora ds-home-aurora-3" />
        <div className="ds-home-stars">
          {ambientDust.map((d, i) => (
            <span
              key={i}
              className="ds-galaxy-star"
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: d.size,
                height: d.size,
                animationDelay: `${d.delay}s`
              }}
            />
          ))}
        </div>
      </div>
      {/* Header padrão — drag area limpa, botões direita */}
      <header
        className="relative z-10 h-10 flex items-stretch border-b border-border/40 bg-background/60 backdrop-blur-xl flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex-1 pl-20" aria-hidden />
        <div
          className="flex items-center gap-2 px-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <ThemeIconToggle />
          <Tooltip label="Configurações">
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <SettingsIcon className="size-3.5" />
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-12">

          {/* Greeting */}
          <div className="mb-10 flex items-center gap-5 ds-fade-up" style={{ animationDuration: '0.7s' }}>
            <div className="relative ds-float">
              <span className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl opacity-70" aria-hidden />
              <Logo size={68} className="relative flex-shrink-0 rounded-2xl shadow-lg shadow-primary/20" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1">
                E aí,{' '}
                <span className="text-primary">{name || 'dev'}</span>
              </h1>
              <p className="text-base text-muted-foreground">
                Tu deixou IA escrever. Deixa o DevSenses te ensinar o que ela fez.
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1.5 leading-relaxed">
                Abre um repositório, edita arquivos (ou deixa Cursor/Copilot fazer), e a IA
                explica cada diff no teu nível — com conceitos, comentários inline e glossário pessoal.
              </p>
            </div>
          </div>

          {/* Open project */}
          <div
            className="mb-6 ds-fade-up"
            style={{ animationDuration: '0.7s', animationDelay: '0.12s', animationFillMode: 'both' }}
          >
            <button
              onClick={pick}
              className="group relative w-full rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/70 bg-card/40 hover:bg-primary/5 backdrop-blur-sm transition-all duration-200 p-7 flex items-center gap-5 cursor-pointer overflow-hidden"
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-primary/8 to-transparent"
                aria-hidden
              />
              <div className="relative w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 flex-shrink-0 shadow-md shadow-primary/10">
                <FolderOpen className="size-6 text-primary" />
                <Sparkles className="absolute -top-1 -right-1 size-3 text-primary/70 ds-icon-drift" />
              </div>
              <div className="relative flex-1 text-left">
                <div className="font-semibold text-base mb-1">Abrir projeto</div>
                <div className="text-xs text-muted-foreground">
                  Escolhe a pasta raiz de qualquer repositório git
                </div>
              </div>
              <ChevronRight className="relative size-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Recents */}
          {recents.length > 0 && (
            <div
              className="ds-fade-up"
              style={{ animationDuration: '0.7s', animationDelay: '0.22s', animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recentes
                </span>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
                {recents.map((r, i) => (
                  <button
                    key={r.path}
                    onClick={() => navigate(`/project?path=${encodeURIComponent(r.path)}`)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary/5 transition-colors group ds-fade-up',
                      i < recents.length - 1 && 'border-b border-border/40'
                    )}
                    style={{
                      animationDuration: '0.5s',
                      animationDelay: `${0.32 + i * 0.06}s`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 group-hover:scale-105 transition-all">
                      <Folder className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate group-hover:text-foreground transition-colors">
                        {r.name}
                      </div>
                      <div className="text-xs text-muted-foreground/80 font-mono truncate">{r.path}</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
