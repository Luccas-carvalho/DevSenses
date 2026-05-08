import { AlertTriangle, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  busy?: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  busy = false,
  error,
  onConfirm,
  onCancel
}: Props): React.ReactElement | null {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[420px] rounded-xl border border-border/60 bg-popover shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            {variant === 'destructive' && <AlertTriangle className="size-4 text-destructive" />}
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 text-[12px] text-foreground/85 leading-relaxed whitespace-pre-wrap">
          {message}
        </div>

        {error && (
          <div className="mx-4 mb-3 text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5 border border-destructive/30">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/40">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-7 px-3 text-[11px] rounded-md hover:bg-accent/60 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              'h-7 px-3 text-[11px] rounded-md disabled:opacity-50 inline-flex items-center gap-1.5',
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {busy && <Loader2 className="size-3 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
