import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bug, X, Lightbulb, Eye, Check, AlertCircle, RefreshCw } from 'lucide-react'
import { Highlight } from 'prism-react-renderer'
import { useCodeTheme } from '@/hooks/useCodeTheme'

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

const CODE_CHARS = ['if(', '&&', '<= 0', '++i', '0x1', '!==', 'fn()', '{}', '//', '===', 'null', '>>1']

const BUG_ANIM_CSS = `
@keyframes bugBounce {
  0%, 100% { transform: translateY(0) scale(1) rotate(-2deg); }
  30% { transform: translateY(-10px) scale(1.12) rotate(3deg); }
  60% { transform: translateY(-4px) scale(1.05) rotate(-1deg); }
}
@keyframes bugGlow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(251,113,133,0.5)) drop-shadow(0 0 14px rgba(251,113,133,0.2)); }
  50% { filter: drop-shadow(0 0 20px rgba(251,113,133,1)) drop-shadow(0 0 40px rgba(251,113,133,0.5)) drop-shadow(0 0 2px #fff); }
}
@keyframes bugGlitch {
  0%, 85%, 100% { transform: skewX(0); opacity: 1; }
  87% { transform: skewX(-8deg) translateX(-3px); opacity: 0.85; filter: hue-rotate(180deg); }
  89% { transform: skewX(6deg) translateX(3px); opacity: 0.9; }
  91% { transform: skewX(-3deg); opacity: 1; filter: hue-rotate(0deg); }
}
@keyframes orbit0 { from { transform: rotate(0deg) translateX(38px) rotate(0deg); } to { transform: rotate(360deg) translateX(38px) rotate(-360deg); } }
@keyframes orbit1 { from { transform: rotate(72deg) translateX(54px) rotate(-72deg); } to { transform: rotate(432deg) translateX(54px) rotate(-432deg); } }
@keyframes orbit2 { from { transform: rotate(144deg) translateX(38px) rotate(-144deg); } to { transform: rotate(504deg) translateX(38px) rotate(-504deg); } }
@keyframes orbit3 { from { transform: rotate(216deg) translateX(54px) rotate(-216deg); } to { transform: rotate(576deg) translateX(54px) rotate(-576deg); } }
@keyframes orbit4 { from { transform: rotate(288deg) translateX(38px) rotate(-288deg); } to { transform: rotate(648deg) translateX(38px) rotate(-648deg); } }
@keyframes ringPulse0 { 0%,100% { opacity:0.12; transform:scale(1); } 50% { opacity:0.28; transform:scale(1.06); } }
@keyframes ringPulse1 { 0%,100% { opacity:0.08; transform:scale(1); } 50% { opacity:0.2; transform:scale(1.1); } }
@keyframes scanLine {
  0% { transform: translateY(-8px); opacity: 0; }
  8% { opacity: 0.6; }
  90% { opacity: 0.3; }
  100% { transform: translateY(96px); opacity: 0; }
}
@keyframes codeFloat {
  0% { transform: translateY(0); opacity: 0; }
  15% { opacity: 1; }
  70% { opacity: 0.6; }
  100% { transform: translateY(-32px); opacity: 0; }
}
@keyframes bgPulse {
  0%, 100% { opacity: 0.04; }
  50% { opacity: 0.09; }
}
`

function BugLoadingAnimation(): React.JSX.Element {
  return (
    <>
      <style>{BUG_ANIM_CSS}</style>
      <div className="relative flex flex-col items-center justify-center py-12 gap-5 overflow-hidden select-none">

        {/* background radial glow */}
        <div
          className="absolute w-48 h-48 rounded-full bg-rose-500 blur-3xl pointer-events-none"
          style={{ animation: 'bgPulse 2.4s ease-in-out infinite' }}
        />

        {/* floating code chars */}
        {CODE_CHARS.map((ch, i) => (
          <div
            key={i}
            className="absolute font-mono text-[10px] text-rose-400/40 pointer-events-none"
            style={{
              left: `${4 + (i % 6) * 17}%`,
              bottom: `${12 + Math.floor(i / 6) * 44}%`,
              animation: `codeFloat ${2.2 + (i * 0.31) % 1.5}s ease-in-out ${(i * 0.45) % 2.1}s infinite`,
            }}
          >
            {ch}
          </div>
        ))}

        {/* orbit stage */}
        <div className="relative flex items-center justify-center w-28 h-28">

          {/* outer ring */}
          <div
            className="absolute w-28 h-28 rounded-full border border-rose-500/20"
            style={{ animation: 'ringPulse1 3s ease-in-out infinite' }}
          />
          {/* inner ring */}
          <div
            className="absolute w-20 h-20 rounded-full border border-rose-400/25"
            style={{ animation: 'ringPulse0 2s ease-in-out infinite' }}
          />

          {/* scan line across center */}
          <div
            className="absolute w-24 h-px bg-gradient-to-r from-transparent via-rose-400/70 to-transparent pointer-events-none"
            style={{ animation: 'scanLine 2.4s linear infinite' }}
          />

          {/* orbiting dots — 5 dots on 2 different radii */}
          {[
            { anim: 'orbit0', dur: '1.8s', cls: 'w-2 h-2 bg-rose-400/90' },
            { anim: 'orbit1', dur: '2.6s', cls: 'w-1.5 h-1.5 bg-rose-300/70' },
            { anim: 'orbit2', dur: '2.1s', cls: 'w-2 h-2 bg-rose-500/80' },
            { anim: 'orbit3', dur: '3s',   cls: 'w-1 h-1 bg-rose-200/60' },
            { anim: 'orbit4', dur: '1.5s', cls: 'w-1.5 h-1.5 bg-rose-400/75' },
          ].map((cfg, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${cfg.cls}`}
              style={{ animation: `${cfg.anim} ${cfg.dur} linear infinite` }}
            />
          ))}

          {/* center bug icon — bounce + glow + glitch */}
          <div className="relative z-10" style={{ animation: 'bugBounce 1.8s ease-in-out infinite' }}>
            <Bug
              className="size-9 text-rose-400"
              style={{ animation: 'bugGlow 1.8s ease-in-out infinite, bugGlitch 4s ease-in-out infinite' }}
            />
          </div>
        </div>

        <div className="text-center space-y-1.5 relative z-10">
          <p className="text-[13px] font-semibold text-foreground/85 tracking-tight">
            IA injetando bug sutil
            <span className="animate-pulse">...</span>
          </p>
          <p className="text-[11px] text-muted-foreground/45 font-mono">
            {'>'} camuflando o erro no código
          </p>
        </div>
      </div>
    </>
  )
}

export default function BugHuntDialog({
  open,
  onClose,
  snippet,
  language
}: Props): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('loading')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [error, setError] = useState('')
  const [hintShown, setHintShown] = useState(false)
  const inFlight = useRef(false)
  const { variant: codeVariant } = useCodeTheme()
  const prismTheme = codeVariant.prism

  useEffect(() => {
    if (!open) return

    // Already have a result or currently loading — just re-attach keyboard handler
    const hasResult = challenge !== null || phase === 'hunting' || phase === 'revealed'
    if (!hasResult && !inFlight.current) {
      void load()
    }

    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function load(): Promise<void> {
    if (inFlight.current) return
    inFlight.current = true
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
    } finally {
      inFlight.current = false
    }
  }

  // Keep mounted (hidden) to preserve state mid-flight and between open/close
  return createPortal(
    <div
      className={`fixed inset-0 z-[2147483000] flex items-center justify-center p-6 bg-black/55 backdrop-blur-sm ${open ? '' : 'hidden'}`}
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
            {challenge && phase !== 'loading' && (
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
          {phase === 'loading' && <BugLoadingAnimation />}

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
                <HighlightedSnippet
                  code={challenge.buggyCode}
                  language={normalizeLanguage(challenge.language)}
                  prismTheme={prismTheme}
                  highlightLine={phase === 'revealed' ? challenge.bugLine : undefined}
                />
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
                    <HighlightedSnippet
                      code={challenge.fixedCode}
                      language={normalizeLanguage(challenge.language)}
                      prismTheme={prismTheme}
                    />
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

const LANG_ALIAS: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  cs: 'csharp',
  'c#': 'csharp',
  cpp: 'cpp',
  'c++': 'cpp',
  golang: 'go',
  rs: 'rust',
  kt: 'kotlin',
  dockerfile: 'docker'
}

function normalizeLanguage(lang?: string): string {
  if (!lang) return 'tsx'
  const lower = lang.toLowerCase().trim()
  return LANG_ALIAS[lower] ?? lower
}

function HighlightedSnippet({
  code,
  language,
  prismTheme,
  highlightLine
}: {
  code: string
  language: string
  prismTheme: import('prism-react-renderer').PrismTheme
  highlightLine?: number
}): React.JSX.Element {
  const total = code.split('\n').length
  const pad = String(total).length

  return (
    <Highlight code={code} language={language} theme={prismTheme}>
      {({ tokens, getLineProps, getTokenProps, style }) => (
        <pre
          className="px-3 py-3 text-[12px] font-mono overflow-auto whitespace-pre"
          style={style}
        >
          {tokens.map((line, lineIdx) => {
            const n = lineIdx + 1
            const isBuggy = highlightLine === n
            const lineProps = getLineProps({ line })
            return (
              <div
                key={lineIdx}
                {...lineProps}
                className={
                  isBuggy
                    ? `${lineProps.className ?? ''} bg-rose-500/10 -mx-3 px-3`.trim()
                    : lineProps.className
                }
              >
                <span className="inline-block w-8 pr-3 text-right text-muted-foreground/50 select-none">
                  {isBuggy ? '➜' : String(n).padStart(pad, ' ')}
                </span>
                {line.map((token, i) => (
                  <span key={i} {...getTokenProps({ token })} />
                ))}
              </div>
            )
          })}
        </pre>
      )}
    </Highlight>
  )
}
