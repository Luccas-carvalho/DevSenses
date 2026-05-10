import { useEffect, useState } from 'react'
import { Shell } from '../Shell'
import { QUIZ_QUESTIONS, scoreQuiz, countCorrect } from '@/lib/quiz'
import { SENIORITY_LABELS, type SeniorityLevel } from '@shared/seniority'
import { Check, X, Sparkles } from 'lucide-react'

interface Props {
  onResult: (level: SeniorityLevel) => void
  onCancel: () => void
}

type Phase = 'answering' | 'revealed' | 'result'

export default function SeniorityQuiz({ onResult, onCancel }: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [phase, setPhase] = useState<Phase>('answering')
  const [animatedCount, setAnimatedCount] = useState(0)

  const q = QUIZ_QUESTIONS[idx]
  const isLast = idx === QUIZ_QUESTIONS.length - 1
  const selected = answers[q.id]

  function pick(opt: number): void {
    if (phase !== 'answering') return
    setAnswers((a) => ({ ...a, [q.id]: opt }))
    setPhase('revealed')
  }

  function next(): void {
    if (isLast) {
      setPhase('result')
    } else {
      setIdx(idx + 1)
      setPhase('answering')
    }
  }

  const correctCount = countCorrect(answers)
  const total = QUIZ_QUESTIONS.length
  const pct = Math.round((correctCount / total) * 100)
  const seniority: SeniorityLevel = scoreQuiz(answers)

  useEffect(() => {
    if (phase !== 'result') return
    setAnimatedCount(0)
    let raf = 0
    const start = performance.now()
    const dur = 900
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimatedCount(Math.round(eased * correctCount))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, correctCount])

  if (phase === 'result') {
    return (
      <Shell
        title="Resultado"
        subtitle="Calibrado pelo que você sabe — não pelo que você diz que sabe."
        hideNext
        hidePrev
      >
        <div className="quiz-result">
          <div className="quiz-result-score">
            <div className="quiz-result-number">
              {animatedCount}
              <span className="quiz-result-total"> / {total}</span>
            </div>
            <div className="quiz-result-pct">{pct}% de acerto</div>
          </div>

          <div className="quiz-result-dots">
            {QUIZ_QUESTIONS.map((qq, i) => {
              const ans = answers[qq.id]
              const correct = ans === qq.correctIdx
              return (
                <span
                  key={qq.id}
                  className={`quiz-result-dot ${correct ? 'is-correct' : 'is-wrong'}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                  title={`${i + 1}. ${correct ? 'Acertou' : 'Errou'}`}
                />
              )
            })}
          </div>

          <div className="quiz-result-seniority">
            <Sparkles size={14} />
            <span className="quiz-result-seniority-label">Seu nível sugerido</span>
            <span className="quiz-result-seniority-value">{SENIORITY_LABELS[seniority]}</span>
          </div>

          <button
            onClick={() => onResult(seniority)}
            className="onboarding-btn-next quiz-result-cta"
          >
            Continuar
          </button>
        </div>
      </Shell>
    )
  }

  const correctIdx = q.correctIdx
  const showFeedback = phase === 'revealed'

  return (
    <Shell
      title={`Pergunta ${idx + 1} de ${QUIZ_QUESTIONS.length}`}
      subtitle="Sem pegadinhas — escolha o que faz mais sentido pra você."
      hideNext
      hidePrev
    >
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'left' }}>
        <div className="quiz-progress">
          {idx + 1} / {QUIZ_QUESTIONS.length}
        </div>
        <div className="quiz-question">{q.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {q.options.map((o, i) => {
            const isPicked = selected === i
            const isCorrect = i === correctIdx
            const cls = ['quiz-option']
            if (showFeedback) {
              if (isCorrect) cls.push('is-correct')
              else if (isPicked) cls.push('is-wrong')
              else cls.push('is-faded')
            } else if (isPicked) {
              cls.push('quiz-option-selected')
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={showFeedback}
                className={cls.join(' ')}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span className="quiz-option-label">{o.label}</span>
                {showFeedback && isCorrect && (
                  <span className="quiz-option-icon is-correct">
                    <Check size={14} />
                  </span>
                )}
                {showFeedback && !isCorrect && isPicked && (
                  <span className="quiz-option-icon is-wrong">
                    <X size={14} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.35)',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button onClick={next} disabled={!showFeedback} className="onboarding-btn-next">
            {isLast ? 'Ver resultado' : 'Próxima'}
          </button>
        </div>
      </div>
    </Shell>
  )
}
