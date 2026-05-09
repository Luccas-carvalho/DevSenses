import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bug, X, Loader2, Lightbulb, Eye, Check, AlertCircle, RefreshCw } from 'lucide-react'

interface Challenge {
  buggyCode: string
  language: string
  hint: string
  bugLine?: number
  explanation: string
  fixedCode: string
}

interface Props {
  open: boolean
  onClose: () => void
  snippet: string
  language?: string
}

type Phase = 'loading' | 'hunting' | 'revealed' | 'error'

export default function BugHuntDialog({
  open,
  onClose,
  snippet,
  language
}: Props): React.JSX.Element | null {
  const [phase, setPhase] = useState<Phase>('loading')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [error, setError] = useState('')
  const [hintShown, setHintShown] = useState(false)

  useEffect(() => {
    if (!open) return
    void load()
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function load(): Promise<void> {
    setPhase('loading')
    setError('')
    setHintShown(false)
    setChallenge(null)
    try {
      const r = await window.api.invoke('ai:bugHunt', { snippet, language })
      setChallenge(r)
      setPhase('hunting')
    } catch (e) {
      setError((e as Error).message ?? 'Falha ao gerar desafio')
      setPhase('error')
    }
  }

  if (!open) return null

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
            <Bug className="size-4 text-rose-400" />
            <span className="text-sm font-semibold">Caça ao bug</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              acha o erro injetado
            </span>
          </div>
          <div className="flex items-center gap-1">
            {challenge && (
              <button
                type="button"
                onClick={() => void load()}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground rounded-md px-2 h-7 hover:bg-accent/60 transition-colors"
                title="Gerar desafio novo"
              >
                <RefreshCw className="size-3" />
                Outro
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

        <div className="flex-1 overflow-auto px-4 py-4 min-h-0">
          {phase === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              IA injetando bug sutil no código...
            </div>
          )}

          {phase === 'error' && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
              <span>
                {error}{' '}
                <button onClick={() => void load()} className="underline hover:no-underline">
                  Tentar de novo
                </button>
              </span>
            </div>
          )}

          {challenge && phase !== 'loading' && (
            <>
              <div className="text-[12px] text-muted-foreground mb-3">
                A IA injetou <strong className="text-foreground">um bug sutil</strong> no código abaixo. Acha ele.
              </div>

              <div className="rounded-md border border-border/40 bg-muted/20 overflow-hidden mb-3">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 bg-background/40 flex items-center gap-2">
                  <span>Código com bug</span>
                  {challenge.language && (
                    <span className="font-mono">{challenge.language}</span>
                  )}
                </div>
                <pre className="px-3 py-3 text-[12px] font-mono text-foreground/90 overflow-auto whitespace-pre">
                  {addLineNumbers(challenge.buggyCode, challenge.bugLine, phase === 'revealed')}
                </pre>
              </div>

              {!hintShown && phase === 'hunting' && (
                <button
                  type="button"
                  onClick={() => setHintShown(true)}
                  className="flex items-center gap-1.5 text-[12px] rounded-md px-3 py-1.5 border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Lightbulb className="size-3.5" />
                  Ver dica
                </button>
              )}

              {hintShown && phase === 'hunting' && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 mb-3 flex items-start gap-2">
                  <Lightbulb className="size-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[12px] text-amber-200/90 leading-relaxed">
                    {challenge.hint}
                  </span>
                </div>
              )}

              {phase === 'hunting' && (
                <button
                  type="button"
                  onClick={() => setPhase('revealed')}
                  className="flex items-center gap-1.5 text-[12px] rounded-md px-3 py-1.5 border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mt-2"
                >
                  <Eye className="size-3.5" />
                  Revelar resposta
                </button>
              )}

              {phase === 'revealed' && (
                <>
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5 mb-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Check className="size-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="text-[12.5px] font-semibold text-emerald-300">
                        Bug encontrado{challenge.bugLine ? ` na linha ${challenge.bugLine}` : ''}
                      </div>
                    </div>
                    <p className="text-[12px] text-foreground/85 leading-relaxed pl-6">
                      {challenge.explanation}
                    </p>
                  </div>

                  <div className="rounded-md border border-border/40 bg-muted/20 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-emerald-400 border-b border-border/40 bg-emerald-500/8">
                      Código corrigido
                    </div>
                    <pre className="px-3 py-3 text-[12px] font-mono text-foreground/90 overflow-auto whitespace-pre">
                      {challenge.fixedCode}
                    </pre>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function addLineNumbers(code: string, bugLine?: number, highlight?: boolean): string {
  const lines = code.split('\n')
  const max = lines.length
  const pad = String(max).length
  return lines
    .map((ln, i) => {
      const n = i + 1
      const isBuggy = highlight && bugLine === n
      const prefix = String(n).padStart(pad, ' ')
      return `${isBuggy ? '➜ ' : '  '}${prefix}  ${ln}`
    })
    .join('\n')
}
