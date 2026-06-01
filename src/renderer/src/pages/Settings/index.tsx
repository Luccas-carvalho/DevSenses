import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Bot, Palette, Folder, BookOpen, Shield, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import Profile from './Profile'
import AI from './AI'
import Appearance from './Appearance'
import Workspace from './Workspace'
import Glossary from './Glossary'
import Privacy from './Privacy'
import About from './About'
import Logo from '@/components/Logo'

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User, component: Profile },
  { id: 'ai', label: 'IA', icon: Bot, component: AI },
  { id: 'appearance', label: 'Aparência', icon: Palette, component: Appearance },
  { id: 'workspace', label: 'Workspace', icon: Folder, component: Workspace },
  { id: 'glossary', label: 'Glossário', icon: BookOpen, component: Glossary },
  { id: 'privacy', label: 'Privacidade', icon: Shield, component: Privacy },
  { id: 'about', label: 'Sobre', icon: Info, component: About }
] as const

export default function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('profile')
  const navigate = useNavigate()
  const Active = TABS.find((t) => t.id === tab)!.component

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header padrão — drag area pros traffic lights macOS */}
      <header
        className="h-10 flex items-stretch border-b border-border/40 bg-background/80 backdrop-blur-xl flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex-1 pl-20 flex items-center gap-2" aria-hidden>
          <Logo size={20} className="rounded-md flex-shrink-0" />
          <span className="text-[12px] font-semibold">DevSenses</span>
          <span className="text-[11px] text-muted-foreground">· Configurações</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className="w-56 flex flex-col flex-shrink-0 bg-black/[0.08] dark:bg-black/[0.20] border-r border-border/30 relative">
          {/* Subtle top gradient accent */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          {/* Back button */}
          <div className="px-3 pt-3 pb-2 relative">
            <button
              onClick={() => {
                if (window.history.length > 1) navigate(-1)
                else navigate('/home')
              }}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-all group w-full px-2 py-1.5 rounded-md hover:bg-accent/40"
            >
              <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform flex-shrink-0" />
              Voltar
            </button>
          </div>

          <div className="px-3 pb-2">
            <div className="h-px bg-border/30" />
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto relative">
            {TABS.map((t) => {
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all relative',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  {/* Left border accent on active */}
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                  )}
                  <t.icon
                    className={cn(
                      'size-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  {t.label}
                </button>
              )
            })}
          </nav>

          {/* Version footer */}
          <VersionFooter />
        </aside>

        {/* Main content — key triggers remount + ds-fade-up on tab change */}
        <main className="flex-1 overflow-auto px-8 py-7">
          <Active key={tab} />
        </main>
      </div>
    </div>
  )
}

function VersionFooter(): React.ReactElement {
  const [version, setVersion] = useState<string | null>(null)
  useEffect(() => {
    window.api
      .invoke('app:getVersion', undefined)
      .then((r) => setVersion(r.version))
      .catch(() => setVersion(null))
  }, [])
  return (
    <div className="px-4 py-3 border-t border-border/30">
      <p className="text-[10px] text-muted-foreground/50 font-mono">
        DevSenses {version ? `v${version}` : ''}
      </p>
    </div>
  )
}

