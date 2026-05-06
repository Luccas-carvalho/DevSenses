import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Loader2, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
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

export default function AskAIInline({ context, contextLabel, className, iconClassName }: Props): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const streamIdRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { value: providerDefault } = useSettings('provider_default')

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  useEffect(() => {
    return window.api.on('providers:stream', (event) => {
      if (event.streamId !== streamIdRef.current) return
      if (event.error) {
        setError(event.error)
        setStatus('error')
        return
      }
      if (event.done) {
        setStatus('done')
        return
      }
      setAnswer((a) => a + event.chunk)
      setStatus('streaming')
    })
  }, [])

  function reset(): void {
    setQuestion('')
    setAnswer('')
    setStatus('idle')
    setError('')
    streamIdRef.current = null
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

  function close(): void {
    if (streamIdRef.current) {
      window.api.invoke('providers:abort', { streamId: streamIdRef.current }).catch(() => {})
    }
    setOpen(false)
    reset()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        title={contextLabel ? `Perguntar IA sobre: ${contextLabel}` : 'Perguntar IA sobre isso'}
        className={cn(
          'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0',
          className
        )}
      >
        <MessageCircle className={cn('size-3.5', iconClassName)} />
      </button>
    )
  }

  const busy = status === 'asking' || status === 'streaming'

  return (
    <div
      className={cn(
        'mt-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 space-y-2 text-[12px]',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
          Perguntar IA · sobre esse trecho
        </span>
        <button
          type="button"
          onClick={close}
          className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded"
          title="Fechar"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Tipo: por que é melhor usar isso? Como funciona na prática?"
          rows={2}
          disabled={busy}
          className="flex-1 resize-none rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy || !question.trim() || !providerDefault}
          className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 h-[30px] text-[11px] font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
          {busy ? 'IA' : 'Enviar'}
        </button>
      </div>

      {(answer || status === 'error') && (
        <div className="rounded-md border border-border/40 bg-background/70 p-2 text-[12px] text-foreground/85 leading-relaxed whitespace-pre-wrap font-normal">
          {status === 'error' ? (
            <span className="text-destructive">{error || 'Falha ao perguntar.'}</span>
          ) : (
            answer
          )}
          {status === 'streaming' && (
            <span className="inline-block ml-0.5 w-1.5 h-3 bg-primary/60 animate-pulse align-middle" />
          )}
        </div>
      )}

      {answer && status === 'done' && (
        <button
          type="button"
          onClick={reset}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Fazer outra pergunta
        </button>
      )}
    </div>
  )
}
