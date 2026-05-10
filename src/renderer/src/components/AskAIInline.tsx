import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, Loader2, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Tooltip from '@/components/ui/Tooltip'
import { useSettings } from '@/hooks/useSettings'
import type { ProviderId } from '@shared/providers'

type Status = 'idle' | 'asking' | 'streaming' | 'done' | 'error'

interface Props {
  context: string
  contextLabel?: string
  className?: string
  iconClassName?: string
}

function buildPrompt(context: string, question: string): string {
  return [
    'Você é um professor explicando código pra um dev junior com TDAH/TEA — precisa de explicações concretas, dialogadas e fáceis de fixar.',
    '',
    'ESTILO OBRIGATÓRIO:',
    '1. Use uma **analogia do dia-a-dia** (pizzaria, banco, hospital, etc) quando o conceito for abstrato. Mantém o vocabulário coerente.',
    '2. Quando explicar mudança/decisão técnica, mostre cenário **antes vs agora** numerado (passo 1, 2, 3…).',
    '3. Se tiver 3+ variáveis/opções, use **tabela markdown** comparando.',
    '4. Foca no **POR QUE**, não só no QUE.',
    '5. Termina com **resumo numa frase** que destila tudo (frase sticky).',
    '6. Português, direto, sem floreio. Code blocks markdown (```) quando for código.',
    '',
    'Tenho uma dúvida sobre essa explicação/conceito específico:',
    '',
    '---',
    context.trim(),
    '---',
    '',
    'Minha dúvida:',
    question.trim(),
    '',
    'Responde focado APENAS nessa dúvida — não reintroduz o tópico inteiro.'
  ].join('\n')
}

const POPOVER_W = 360

export default function AskAIInline({ context, contextLabel, className, iconClassName }: Props): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const streamIdRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const { value: providerDefault } = useSettings('provider_default')

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    return window.api.on('providers:stream', (event) => {
      if (event.streamId !== streamIdRef.current) return
      if (event.error) { setError(event.error); setStatus('error'); return }
      if (event.done) { setStatus('done'); return }
      setAnswer((a) => a + event.chunk)
      setStatus('streaming')
    })
  }, [])

  // close on click-outside
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent): void {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return
      close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function openPopover(e: React.MouseEvent): void {
    e.stopPropagation()
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()

    let left = rect.right - POPOVER_W
    if (left < 8) left = 8
    if (left + POPOVER_W > window.innerWidth - 8) left = window.innerWidth - POPOVER_W - 8

    // prefer below, fall back to above
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > 260 ? rect.bottom + 6 : rect.top - 6 - 260

    setPos({ top, left })
    setOpen(true)
  }

  function reset(): void {
    setQuestion('')
    setAnswer('')
    setStatus('idle')
    setError('')
    streamIdRef.current = null
  }

  function close(): void {
    if (streamIdRef.current) {
      window.api.invoke('providers:abort', { streamId: streamIdRef.current }).catch(() => {})
    }
    setOpen(false)
    reset()
  }

  async function send(): Promise<void> {
    const q = question.trim()
    if (!q || !providerDefault) return
    if (streamIdRef.current) {
      await window.api.invoke('providers:abort', { streamId: streamIdRef.current })
    }
    const sid = `ask-${Date.now()}`
    streamIdRef.current = sid
    setAnswer('')
    setError('')
    setStatus('asking')
    await window.api.invoke('providers:invoke', {
      id: providerDefault as ProviderId,
      prompt: buildPrompt(context, q),
      streamId: sid
    })
  }

  const busy = status === 'asking' || status === 'streaming'

  return (
    <>
      <Tooltip label={contextLabel ? `Perguntar IA sobre: ${contextLabel}` : 'Perguntar IA sobre isso'}>
        <button
          ref={triggerRef}
          type="button"
          onClick={openPopover}
          className={cn(
            'inline-flex items-center justify-center rounded-md p-1 transition-colors flex-shrink-0',
            open
              ? 'text-primary bg-primary/15'
              : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10',
            className
          )}
        >
          <MessageCircle className={cn('size-3.5', iconClassName)} />
        </button>
      </Tooltip>

      {open && pos && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: POPOVER_W, zIndex: 9800 }}
          className="rounded-xl border border-primary/25 bg-popover/96 backdrop-blur-xl shadow-2xl shadow-black/40 ds-fade-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-center justify-between px-3 h-9 border-b border-border/30 bg-primary/5">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary/90 uppercase tracking-wider">
                Perguntar IA
              </span>
              {contextLabel && (
                <span className="text-[10px] text-muted-foreground/55 truncate max-w-[140px]">
                  · {contextLabel}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              className="flex items-center justify-center size-5 rounded text-muted-foreground/50 hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>

          <div className="p-3 space-y-2.5">
            {/* input + send */}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder="Tipo: por que é melhor usar isso? Como funciona?"
                rows={2}
                disabled={busy}
                className="flex-1 resize-none rounded-lg border border-border/50 bg-background/70 px-2.5 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/45 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 disabled:opacity-60 transition-colors"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={busy || !question.trim() || !providerDefault}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 h-[58px] text-[11px] font-semibold disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all flex-col justify-center"
              >
                {busy
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Send className="size-3.5" />
                }
                <span>{busy ? '...' : '⌘↵'}</span>
              </button>
            </div>

            {/* answer */}
            {(answer || status === 'error') && (
              <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-[12px] text-foreground/85 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {status === 'error' ? (
                  <span className="text-destructive">{error || 'Falha ao perguntar.'}</span>
                ) : (
                  answer
                )}
                {status === 'streaming' && (
                  <span className="inline-block ml-0.5 w-1.5 h-3 bg-primary/70 animate-pulse align-middle rounded-sm" />
                )}
              </div>
            )}

            {answer && status === 'done' && (
              <button
                type="button"
                onClick={reset}
                className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                ↺ Fazer outra pergunta
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
