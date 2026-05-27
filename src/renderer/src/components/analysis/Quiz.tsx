import { useEffect, useState, useCallback } from 'react'
import { Brain, Check, X, RefreshCw, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// Splits a string by inline ``backticks`` and renders code spans with mono + colored bg.
// Keeps everything else as plain text. No block code, no other markdown.
function InlineMd({ text }: { text: string }): React.ReactElement {
  const parts = text.split(/(`[^`\n]+`)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') && p.length > 2 ? (
          <code
            key={i}
            className="inline px-1.5 py-px rounded text-[0.9em] font-mono bg-muted/70 text-rose-300 border border-border/40"
          >
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}

interface QuizItem {
  id: number
  analysisId: number
  question: string
  options: string[]
  correctIdx: number
  explainCorrect: string
  explainWrong: string
  userAnswerIdx: number | null
  answeredAt: number | null
  createdAt: number
}

interface Props {
  analysisId: number
}

export default function Quiz({ analysisId }: Props): React.ReactElement {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [items, setItems] = useState<QuizItem[]>([])
  const [error, setError] = useState<string>('')

  const load = useCallback(
    async (regenerate = false): Promise<void> => {
      if (state === 'loading') return
      setState('loading')
      setError('')
      try {
        const result = await window.api.invoke('quiz:generate', {
          analysisId,
          regenerate
        })
        setItems(result)
        setState('ready')
      } catch (e) {
        setError((e as Error).message ?? 'Falha ao gerar quiz')
        setState('error')
      }
    },
    [analysisId, state]
  )

  useEffect(() => {
    let cancelled = false
    setState('loading')
    window.api
      .invoke('quiz:byAnalysis', { analysisId })
      .then((existing) => {
        if (cancelled) return
        if (existing.length > 0) {
          setItems(existing)
          setState('ready')
        } else {
          void load(false)
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError((e as Error).message)
        setState('error')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId])

  async function answer(quiz: QuizItem, idx: number): Promise<void> {
    if (quiz.userAnswerIdx != null) return
    const updated = await window.api.invoke('quiz:answer', { id: quiz.id, idx })
    if (updated) {
      setItems((prev) => prev.map((q) => (q.id === quiz.id ? updated : q)))
    }
  }

  const correct = items.filter(
    (q) => q.userAnswerIdx != null && q.userAnswerIdx === q.correctIdx
  ).length
  const answered = items.filter((q) => q.userAnswerIdx != null).length

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 h-10 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-primary" />
          <span className="text-[12px] font-semibold text-foreground">Quiz rápido</span>
          {state === 'ready' && items.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {answered}/{items.length} · {correct} certas
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={state === 'loading'}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          title="Gerar perguntas novas"
        >
          <RefreshCw className={cn('size-3', state === 'loading' && 'animate-spin')} />
          Novas
        </button>
      </div>

      {state === 'loading' && items.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-6 text-[12px] text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Gerando perguntas...
        </div>
      )}

      {state === 'error' && (
        <div className="px-4 py-4 text-[12px] text-destructive">
          {error}
          <button
            type="button"
            onClick={() => void load(true)}
            className="ml-2 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="divide-y divide-border/30">
          {items.map((q, qi) => (
            <QuestionCard key={q.id} quiz={q} index={qi} onAnswer={(idx) => void answer(q, idx)} />
          ))}
        </div>
      )}

      {state === 'ready' && answered === items.length && items.length > 0 && (
        <div className="px-4 py-3 border-t border-border/40 bg-primary/5 flex items-center gap-2 text-[12px] text-foreground/85">
          <Sparkles className="size-3.5 text-primary" />
          {correct === items.length
            ? 'Mandou bem! Conceito travado.'
            : `${correct}/${items.length} — relê a explicação onde errou e tenta de novo.`}
        </div>
      )}
    </div>
  )
}

function QuestionCard({
  quiz,
  index,
  onAnswer
}: {
  quiz: QuizItem
  index: number
  onAnswer: (idx: number) => void
}): React.ReactElement {
  const answered = quiz.userAnswerIdx != null
  const isCorrect = answered && quiz.userAnswerIdx === quiz.correctIdx

  return (
    <div className="px-4 py-4">
      <div className="flex items-start gap-2 mb-3">
        <span className="text-[10px] font-bold text-muted-foreground/60 mt-0.5 w-5">
          {String(index + 1).padStart(2, '0')}
        </span>
        <p className="text-[13px] font-medium text-foreground leading-snug">
          <InlineMd text={quiz.question} />
        </p>
      </div>
      <div className="flex flex-col gap-1.5 ml-7">
        {quiz.options.map((opt, idx) => {
          const isUser = quiz.userAnswerIdx === idx
          const isCorrectOpt = idx === quiz.correctIdx
          const showAsCorrect = answered && isCorrectOpt
          const showAsWrong = answered && isUser && !isCorrectOpt

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAnswer(idx)}
              disabled={answered}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md border text-[12px] transition-all flex items-center gap-2.5',
                !answered && 'border-border/40 bg-muted/30 hover:bg-muted/60 hover:border-border/60',
                showAsCorrect && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
                showAsWrong && 'border-destructive/50 bg-destructive/10 text-destructive',
                answered &&
                  !isUser &&
                  !isCorrectOpt &&
                  'border-border/30 bg-muted/10 text-muted-foreground/60'
              )}
            >
              <span
                className={cn(
                  'size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                  showAsCorrect && 'bg-emerald-500/30',
                  showAsWrong && 'bg-destructive/30',
                  !answered && 'bg-muted/60 text-muted-foreground',
                  answered && !isUser && !isCorrectOpt && 'bg-muted/30 text-muted-foreground/50'
                )}
              >
                {showAsCorrect ? (
                  <Check className="size-3" />
                ) : showAsWrong ? (
                  <X className="size-3" />
                ) : (
                  String.fromCharCode(65 + idx)
                )}
              </span>
              <span className="flex-1">
                <InlineMd text={opt} />
              </span>
            </button>
          )
        })}
      </div>

      {answered && (
        <div
          className={cn(
            'mt-3 ml-7 rounded-md px-3 py-2 text-[11.5px] leading-relaxed',
            isCorrect
              ? 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-200/90'
              : 'bg-destructive/8 border border-destructive/20 text-foreground/85'
          )}
        >
          <strong className="font-semibold">
            {isCorrect ? '✓ Correto. ' : '✗ Não foi dessa. '}
          </strong>
          <InlineMd text={isCorrect ? quiz.explainCorrect : quiz.explainWrong} />
          {!isCorrect && (
            <div className="mt-1.5 text-foreground/70">
              <span className="text-emerald-400 font-semibold">Resposta: </span>
              <InlineMd
                text={`${quiz.options[quiz.correctIdx]}. ${quiz.explainCorrect}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
