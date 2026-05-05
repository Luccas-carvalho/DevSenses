import { useState } from 'react'
import { Shell } from '../Shell'
import { QUIZ_QUESTIONS, scoreQuiz } from '@/lib/quiz'
import type { SeniorityLevel } from '@shared/seniority'

interface Props {
  onResult: (level: SeniorityLevel) => void
  onCancel: () => void
}

export default function SeniorityQuiz({ onResult, onCancel }: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const q = QUIZ_QUESTIONS[idx]
  const isLast = idx === QUIZ_QUESTIONS.length - 1
  const selected = answers[q.id]

  function pick(opt: number): void {
    setAnswers((a) => ({ ...a, [q.id]: opt }))
  }

  function next(): void {
    if (isLast) {
      const level = scoreQuiz(answers)
      onResult(level)
    } else {
      setIdx(idx + 1)
    }
  }

  return (
    <Shell title={`Pergunta ${idx + 1} de ${QUIZ_QUESTIONS.length}`} subtitle="Sem pegadinhas — escolha o que faz mais sentido pra você." hideNext hidePrev>
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'left' }}>
        <div className="quiz-progress">{idx + 1} / {QUIZ_QUESTIONS.length}</div>
        <div className="quiz-question">{q.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {q.options.map((o, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              className={`quiz-option ${selected === i ? 'quiz-option-selected' : ''}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onCancel}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={next}
            disabled={selected === undefined}
            className="onboarding-btn-next"
          >
            {isLast ? 'Ver resultado' : 'Próxima'}
          </button>
        </div>
      </div>
    </Shell>
  )
}
