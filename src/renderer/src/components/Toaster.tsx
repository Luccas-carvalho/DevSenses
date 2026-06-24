import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore, type ToastTone } from '@/stores/toast'

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info }
const TONE = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-primary'
} satisfies Record<ToastTone, string>

/** Toasts in-app (canto inferior direito). Usados quando a janela está em foco —
 *  fora de foco vira notificação nativa do SO (ver main/ipc/notify.ts). */
export function Toaster(): React.JSX.Element {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[2147483600] flex w-[330px] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const I = ICON[t.tone]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-popover px-4 py-3 shadow-2xl shadow-black/40"
            >
              <I className={cn('mt-0.5 size-4 shrink-0', TONE[t.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">{t.title}</p>
                {t.body && (
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{t.body}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body
  )
}
