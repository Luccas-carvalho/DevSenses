import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Bot, Palette, Folder, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import Profile from './Profile'
import AI from './AI'
import Appearance from './Appearance'
import Workspace from './Workspace'
import Glossary from './Glossary'
import Logo from '@/components/Logo'

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User, component: Profile },
  { id: 'ai', label: 'IA', icon: Bot, component: AI },
  { id: 'appearance', label: 'Aparência', icon: Palette, component: Appearance },
  { id: 'workspace', label: 'Workspace', icon: Folder, component: Workspace },
  { id: 'glossary', label: 'Glossário', icon: BookOpen, component: Glossary }
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
        <div className="flex-1 pl-20" aria-hidden />
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <aside className="w-56 flex flex-col flex-shrink-0 bg-black/[0.08] dark:bg-black/[0.20]">
          <div className="px-3 pt-2 pb-3 flex items-center gap-2">
            <Logo size={24} className="flex-shrink-0 rounded-md" />
            <span className="text-sm font-semibold text-foreground">DevSenses</span>
          </div>
          <div className="p-3 border-b border-border/40">
            <button
              onClick={() => {
                if (window.history.length > 1) navigate(-1)
                else navigate('/home')
              }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
              voltar
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  tab === t.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                )}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto px-10 py-8">
          <Active />
        </main>
      </div>
    </div>
  )
}
