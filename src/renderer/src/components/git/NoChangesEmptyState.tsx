import { useEffect, useState } from 'react'
import {
  GitPullRequest,
  ExternalLink,
  Folder,
  Globe,
  ChevronRight,
  Sparkles,
  Upload,
  Loader2
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
  branch: string | null
  hasUpstream: boolean
  hasRemote: boolean
  onPreviewPR: () => void
  onPublished: () => void
}

export default function NoChangesEmptyState({
  path,
  branch,
  hasUpstream,
  hasRemote,
  onPreviewPR,
  onPublished
}: Props): React.ReactElement {
  const [remote, setRemote] = useState<RemoteInfo | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')

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
  const canPreviewPR = isGitHub && hasUpstream && !!branch
  const showPublish = !hasUpstream && hasRemote && !!branch

  async function publishBranch(): Promise<void> {
    if (publishing) return
    setPublishing(true)
    setPublishError('')
    const r = await window.api.invoke('git:push', { path, setUpstream: true })
    setPublishing(false)
    if (!r.ok) {
      setPublishError(r.error ?? 'Falha ao publicar')
      return
    }
    onPublished()
  }

  return (
    <div className="flex flex-col items-center px-6 py-10 max-w-[640px] mx-auto">
      <div className="w-full mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Sem alterações locais</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Nada pra commitar agora. Algumas sugestões do que dá pra fazer:
            </p>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2">
        {showPublish && (
          <Card
            highlight
            icon={
              publishing ? (
                <Loader2 className="size-4 text-primary animate-spin" />
              ) : (
                <Upload className="size-4 text-primary" />
              )
            }
            title="Publicar branch"
            desc={
              <>
                A branch{' '}
                <code className="px-1 rounded bg-primary/15 text-primary font-mono text-[11px]">
                  {branch}
                </code>{' '}
                ainda não foi publicada no remoto. Publica pra abrir PR e colaborar.
                {publishError && (
                  <span className="block mt-1 text-destructive">{publishError}</span>
                )}
              </>
            }
            shortcut="⌘P"
            actionLabel={publishing ? 'Publicando…' : 'Publicar branch'}
            onAction={publishBranch}
            disabled={publishing}
          />
        )}
        {canPreviewPR && (
          <Card
            highlight
            icon={<GitPullRequest className="size-4 text-primary" />}
            title="Visualizar Pull Request"
            desc={
              <>
                A branch{' '}
                <code className="px-1 rounded bg-primary/15 text-primary font-mono text-[11px]">
                  {branch}
                </code>{' '}
                está publicada. Vê o que vai entrar no PR antes de abrir.
              </>
            }
            shortcut="⌘⌥P"
            actionLabel="Visualizar PR"
            onAction={onPreviewPR}
          />
        )}

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
          desc="Abre a pasta do repositório."
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
