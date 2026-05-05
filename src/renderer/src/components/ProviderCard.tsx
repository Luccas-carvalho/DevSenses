import { Check, X, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProviderId, ProviderStatus } from '@shared/providers'
import { PROVIDER_META } from '@shared/providers'

interface Props {
  id: ProviderId
  status: ProviderStatus | undefined
  loading?: boolean
  selected?: boolean
  onSelect?: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export function ProviderCard({
  id,
  status,
  loading,
  selected,
  onSelect,
  disabled,
  children
}: Props) {
  const meta = PROVIDER_META[id]
  const installed = status?.installed
  const interactive = !disabled && installed
  const handleClick = (): void => {
    if (interactive && onSelect) onSelect()
  }
  const handleKey = (e: React.KeyboardEvent): void => {
    if (!interactive || !onSelect) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKey}
      className={cn(
        'rounded-xl border bg-card transition',
        selected && 'border-primary ring-2 ring-primary/30',
        !selected && interactive && 'border-border hover:bg-accent cursor-pointer',
        !installed && 'border-border opacity-60 cursor-not-allowed',
        selected && interactive && 'cursor-pointer'
      )}
    >
      <div className="p-4 flex items-start gap-3">
        <div
          className={cn(
            'mt-1 size-7 rounded-full flex items-center justify-center shrink-0',
            installed ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : installed ? (
            <Check className="size-4" />
          ) : (
            <X className="size-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{meta.label}</span>
            {status?.version && (
              <span className="text-[10px] font-mono text-muted-foreground">v{status.version}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          {!installed && (
            <a
              href={meta.homepage}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline"
            >
              Instalar <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
      {children && (
        <div
          className="px-4 pb-3 -mt-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}
