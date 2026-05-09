import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Lightbulb, X, Loader2, Send, AlertCircle, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  diff: string
}

const SUGGESTIONS = [
  'Usar useReducer em vez de múltiplos useState',
  'Trocar polling por websocket / SSE',
  'Memoizar isso com useMemo',
  'Refatorar pra Map em vez de array.find',
  'Extrair lógica pra custom hook',
  'Usar Web Worker pra processamento pesado'
]

export default function WhatIfDialog({ open, onClose, diff }: Props): React.JSX.Element | null {
  const [alt, setAlt] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) {
      setAlt('')
      setContent('')
      setError('')
      return
    }
    setTimeout(() => inputRef.current?.focus(), 60)
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  async function run(): Promise<void> {
    if (!alt.trim() || loading) return
    setLoading(true)
    setError('')
    setContent('')
    try {
      const r = await window.api.invoke('ai:whatIf', { diff, alternative: alt })
      setContent(r)
    } catch (e) {
      setError((e as Error).message ?? 'Falha ao comparar')
    } finally {
      setLoading(false)
    }
  }

  async function copyContent(): Promise<void> {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] flex items-center justify-center p-6 bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-popover border border-border/60 rounded-xl shadow-2xl shadow-black/40 ds-fade-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 text-amber-400" />
            <span className="text-sm font-semibold">What if?</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              comparar abordagens
            </span>
          </div>
          <div className="flex items-center gap-1">
            {content && !loading && (
              <button
                onClick={() => void copyContent()}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground rounded-md px-2 h-7 hover:bg-accent/60 transition-colors"
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border/30 flex-shrink-0">
          <div className="text-[11px] text-muted-foreground mb-2">
            E se o código tivesse sido feito de outro jeito?
          </div>
          <textarea
            ref={inputRef}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                void run()
              }
            }}
            placeholder="Ex: 'Usar useReducer em vez de useState' ou 'Trocar fetch por SWR'..."
            rows={2}
            className="w-full text-[13px] bg-muted/30 border border-border/40 rounded-md px-3 py-2 outline-none focus:border-primary/50 transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAlt(s)}
                  className="text-[10px] text-muted-foreground hover:text-foreground rounded px-2 py-0.5 border border-border/40 bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void run()}
              disabled={!alt.trim() || loading}
              className={cn(
                'flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold transition-colors',
                alt.trim() && !loading
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted/40 text-muted-foreground/50 cursor-not-allowed'
              )}
            >
              {loading ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
              Comparar
              <kbd className="text-[9px] font-mono opacity-70 ml-1">⌘↵</kbd>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4 min-h-0">
          {!content && !loading && !error && (
            <div className="text-[12px] text-muted-foreground italic text-center mt-8">
              Descreve a alternativa que tu quer comparar com o que foi feito.
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Comparando abordagens...
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {content && !loading && (
            <div className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
