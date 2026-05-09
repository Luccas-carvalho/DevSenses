import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X, Loader2, Copy, Check, AlertCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  selection: string
  language?: string
}

export default function CheatSheetDialog({
  open,
  onClose,
  selection,
  language
}: Props): React.JSX.Element | null {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const ranForRef = useRef<string>('')

  useEffect(() => {
    if (!open || !selection) return
    if (ranForRef.current === selection) return
    ranForRef.current = selection

    let cancelled = false
    setLoading(true)
    setContent('')
    setError('')
    window.api
      .invoke('ai:cheatSheet', { selection, language })
      .then((r) => {
        if (!cancelled) setContent(r)
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message ?? 'Falha')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, selection, language])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

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
        className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-popover border border-border/60 rounded-xl shadow-2xl shadow-black/40 ds-fade-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-semibold">Cheat sheet</span>
            {language && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-mono">
                {language}
              </span>
            )}
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

        <div className="px-4 py-3 border-b border-border/30 bg-muted/20 flex-shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1">
            Trecho
          </div>
          <pre className="text-[11px] font-mono text-foreground/85 max-h-[120px] overflow-auto whitespace-pre-wrap break-all">
            {selection.slice(0, 500)}
            {selection.length > 500 && '...'}
          </pre>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4 min-h-0">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Gerando cheat sheet...
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {content && !loading && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
              <CheatSheetMarkdown text={content} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function CheatSheetMarkdown({ text }: { text: string }): React.JSX.Element {
  // lightweight render: leverage <pre> for code fences, otherwise plain
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  let codeBuf: string[] | null = null

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (codeBuf === null) {
        codeBuf = []
      } else {
        out.push(
          <pre
            key={`pre-${i}`}
            className="bg-muted/40 border border-border/40 rounded-md px-3 py-2 my-2 overflow-x-auto font-mono text-[12px]"
          >
            {codeBuf.join('\n')}
          </pre>
        )
        codeBuf = null
      }
      return
    }
    if (codeBuf !== null) {
      codeBuf.push(line)
      return
    }

    if (line.startsWith('### ')) {
      out.push(
        <h4 key={i} className="text-sm font-semibold mt-4 mb-1.5 text-primary">
          {line.slice(4)}
        </h4>
      )
    } else if (line.startsWith('- ')) {
      out.push(
        <div key={i} className="flex gap-2 mb-1">
          <span className="text-primary/50 text-xs mt-1">•</span>
          <span className="text-[13px]">{renderLineInline(line.slice(2), i)}</span>
        </div>
      )
    } else if (!line.trim()) {
      out.push(<div key={i} className="h-1.5" />)
    } else {
      out.push(
        <p key={i} className="text-[13px] leading-relaxed mb-1">
          {renderLineInline(line, i)}
        </p>
      )
    }
  })

  return <>{out}</>
}

function renderLineInline(text: string, baseKey: number): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={`${baseKey}-c-${i}`} className="bg-muted px-1 py-0.5 rounded text-[11.5px] font-mono text-primary/90">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`${baseKey}-b-${i}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}
