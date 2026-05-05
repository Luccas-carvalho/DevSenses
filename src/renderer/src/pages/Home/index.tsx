import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Folder,
  Settings as SettingsIcon,
  FolderOpen,
  Clock,
  ChevronRight,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import type { ThemeMode } from '@shared/settings'
import { cn } from '@/lib/utils'

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
        <button
          key={value}
          onClick={() => {
            setTheme(value)
            window.api.invoke('settings:set', { key: 'theme', value })
          }}
          title={label}
          className={cn(
            'flex items-center justify-center w-7 h-6 rounded transition-colors',
            theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="size-3.5" />
        </button>
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

  async function pick(): Promise<void> {
    const r = await window.api.invoke('workspace:pickFolder', undefined)
    if (r) {
      const next = await window.api.invoke('workspace:recent', undefined)
      setRecents(next)
      navigate(`/project?path=${encodeURIComponent(r.path)}`)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header padrão — drag area limpa, botões direita */}
      <header
        className="h-10 flex items-stretch border-b border-border/40 bg-background/80 backdrop-blur-xl flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex-1 pl-20" aria-hidden />
        <div
          className="flex items-center gap-2 px-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <ThemeIconToggle />
          <button
            onClick={() => navigate('/settings')}
            title="Configurações"
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <SettingsIcon className="size-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-12">

          {/* Greeting */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              E aí,{' '}
              <span className="text-primary">{name || 'dev'}</span>
            </h1>
            <p className="text-base text-muted-foreground">
              Seleciona um projeto pra o DevSenses começar a analisar os diffs.
            </p>
          </div>

          {/* Open project */}
          <button
            onClick={pick}
            className="w-full group rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-card/50 hover:bg-primary/5 transition-all duration-200 p-10 flex flex-col items-center gap-3 mb-6 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <FolderOpen className="size-5 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm mb-1">Abrir projeto</div>
              <div className="text-xs text-muted-foreground">Seleciona a pasta raiz de um repo git</div>
            </div>
          </button>

          {/* Recents */}
          {recents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recentes</span>
              </div>
              <div className="rounded-2xl border border-border overflow-hidden">
                {recents.map((r, i) => (
                  <button
                    key={r.path}
                    onClick={() => navigate(`/project?path=${encodeURIComponent(r.path)}`)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-accent/60 transition-colors group',
                      i < recents.length - 1 && 'border-b border-border/60'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Folder className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{r.path}</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
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
