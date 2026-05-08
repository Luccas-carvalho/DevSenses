import { useEffect, useState } from 'react'
import {
  ExternalLink,
  Folder,
  Globe,
  ChevronRight,
  Sparkles,
  BookOpen,
  Brain,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RemoteInfo {
  url: string | null
  webUrl: string | null
  owner: string | null
  repo: string | null
  host: string | null
}

interface Props {
  path: string
}

export default function NoChangesEmptyState({ path }: Props): React.ReactElement {
  const [remote, setRemote] = useState<RemoteInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api
      .invoke('git:remoteUrl', { path })
      .then((r) => {
        if (!cancelled) setRemote(r as RemoteInfo)
      })
      .catch(() => setRemote(null))
    return () => {
      cancelled = true
    }
  }, [path])

  const isGitHub = remote?.host === 'github.com'

  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-[680px] mx-auto">
      <div className="w-full mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/5">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Tudo limpo por aqui</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Sem alterações no working tree. Edita um arquivo (ou deixa Cursor/Copilot fazer)
              e volta — eu explico tudo que mudou.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full mb-6 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
        <div className="text-[11px] uppercase tracking-wider text-primary/80 font-bold mb-2.5">
          Como o DevSenses funciona
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Pillar
            icon={<Layers className="size-4 text-primary" />}
            title="Lê o diff"
            desc="Vê tudo que tu (ou tua IA) mudou no projeto."
          />
          <Pillar
            icon={<Brain className="size-4 text-primary" />}
            title="Explica IA"
            desc="Te ensina o que cada trecho faz e por quê."
          />
          <Pillar
            icon={<BookOpen className="size-4 text-primary" />}
            title="Fixa conceito"
            desc="Glossário, comentários ancorados, histórico."
          />
        </div>
      </div>

      <div className="w-full">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold mb-2 px-1">
          Atalhos pro repositório
        </div>
        <div className="space-y-2">
          <Card
            icon={<ExternalLink className="size-4 text-muted-foreground" />}
            title="Abrir no editor"
            desc="Abre o repositório no editor padrão configurado."
            shortcut="⌘⇧A"
            actionLabel="Abrir editor"
            onAction={() => window.api.invoke('repository:openInEditor', { path })}
          />

          <Card
            icon={<Folder className="size-4 text-muted-foreground" />}
            title="Mostrar no Finder"
            desc="Abre a pasta do repositório no Finder."
            shortcut="⌘⇧F"
            actionLabel="Mostrar no Finder"
            onAction={() => window.api.invoke('repository:openInFinder', { path })}
          />

          {isGitHub && remote?.webUrl && (
            <Card
              icon={<Globe className="size-4 text-muted-foreground" />}
              title="Ver no GitHub"
              desc={
                <>
                  Abre{' '}
                  <code className="px-1 rounded bg-muted/60 text-foreground/80 font-mono text-[11px]">
                    {remote.owner}/{remote.repo}
                  </code>{' '}
                  no navegador.
                </>
              }
              shortcut="⌘⇧G"
              actionLabel="Ver no GitHub"
              onAction={() =>
                remote.webUrl && window.api.invoke('repository:openUrl', { url: remote.webUrl })
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Pillar({
  icon,
  title,
  desc
}: {
  icon: React.ReactNode
  title: string
  desc: string
}): React.ReactElement {
  return (
    <div className="rounded-lg bg-card/40 p-2.5 border border-border/30">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-[10px] text-muted-foreground/80 leading-tight">{desc}</p>
    </div>
  )
}

function Card({
  icon,
  title,
  desc,
  shortcut,
  actionLabel,
  onAction,
  highlight,
  disabled
}: {
  icon: React.ReactNode
  title: string
  desc: React.ReactNode
  shortcut?: string
  actionLabel: string
  onAction: () => void
  highlight?: boolean
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 flex items-start gap-3 transition-colors',
        highlight
          ? 'border-primary/40 bg-primary/5'
          : 'border-border/40 bg-card/40 hover:bg-card/70'
      )}
    >
      <div className="size-8 rounded-md bg-background/60 border border-border/30 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground/80 mt-0.5 leading-snug">{desc}</div>
        {shortcut && (
          <div className="text-[10px] text-muted-foreground/50 mt-1.5 font-mono">{shortcut}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1 h-7 px-3 rounded-md text-[11px] font-medium flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          highlight
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-border/50 bg-card/60 hover:bg-accent/60'
        )}
      >
        {actionLabel}
        <ChevronRight className="size-3" />
      </button>
    </div>
  )
}
