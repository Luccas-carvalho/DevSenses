import { useEffect, useRef, useState } from 'react'
import HighlightedBlock from '@/components/HighlightedBlock'
import { createPortal } from 'react-dom'
import { Sparkles, Loader2, AlertCircle, BookmarkPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  term: string
  contextSnippet?: string
}

interface Definition {
  definition: string
  example: string
}

export default function TermLink({ term, contextSnippet }: Props): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Definition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const r = anchorRef.current?.getBoundingClientRect()
    if (r) {
      const top = r.bottom + 6
      // clamp left so popover doesn't overflow the viewport
      const desiredLeft = r.left
      const maxLeft = window.innerWidth - 320 - 12
      setPos({ top, left: Math.max(12, Math.min(desiredLeft, maxLeft)) })
    }

    function handleClick(e: MouseEvent): void {
      const t = e.target as Node
      if (popRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      setOpen(false)
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  async function load(regenerate = false): Promise<void> {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const result = await window.api.invoke('concepts:explainTerm', {
        term,
        contextSnippet,
        regenerate
      })
      setData(result)
    } catch (e) {
      setError((e as Error).message ?? 'Falha ao explicar termo')
    } finally {
      setLoading(false)
    }
  }

  function handleClick(e: React.MouseEvent): void {
    e.preventDefault()
    e.stopPropagation()
    const next = !open
    setOpen(next)
    if (next && !data && !loading) void load(false)
  }

  async function saveToGlossary(): Promise<void> {
    try {
      await window.api.invoke('concepts:upsert', {
        name: term,
        category: 'general'
      })
    } catch {
      // silent
    }
  }

  return (
    <>
      <span
        ref={anchorRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick(e as unknown as React.MouseEvent)
        }}
        className={cn(
          'cursor-pointer underline decoration-dotted decoration-primary/60 underline-offset-2 hover:bg-primary/10 hover:text-primary transition-colors rounded-sm px-0.5 -mx-0.5',
          open && 'bg-primary/10 text-primary'
        )}
      >
        {term}
      </span>

      {open &&
        pos &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[2147483000] w-[320px] max-w-[92vw] rounded-lg border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 ds-fade-up"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="px-3 pt-2.5 pb-1.5 border-b border-border/40 flex items-center justify-between">
              <span className="font-mono text-[12px] font-semibold text-primary">{term}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Conceito
              </span>
            </div>

            <div className="px-3 py-2.5 min-h-[60px]">
              {loading && (
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Explicando...
                </div>
              )}

              {error && !loading && (
                <div className="flex items-start gap-1.5 text-[12px] text-destructive">
                  <AlertCircle className="size-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    {error}{' '}
                    <button
                      type="button"
                      onClick={() => void load(true)}
                      className="underline hover:no-underline"
                    >
                      Tentar de novo
                    </button>
                  </span>
                </div>
              )}

              {data && !loading && (
                <>
                  <p className="text-[12.5px] text-foreground/90 leading-relaxed">
                    {data.definition}
                  </p>
                  {data.example && (
                    <div className="mt-2">
                      <HighlightedBlock code={data.example} />
                    </div>
                  )}
                </>
              )}
            </div>

            {data && !loading && (
              <div className="px-2 py-1.5 border-t border-border/40 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void saveToGlossary()}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground rounded px-2 py-1 hover:bg-accent/60 transition-colors"
                  title="Adicionar ao glossário pessoal"
                >
                  <BookmarkPlus className="size-3" />
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => void load(true)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground rounded px-2 py-1 hover:bg-accent/60 transition-colors ml-auto"
                  title="Pedir nova explicação"
                >
                  <Sparkles className="size-3" />
                  Mais a fundo
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  )
}
