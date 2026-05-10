import { useState } from 'react'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { SENIORITY_LABELS, SENIORITY_DESCRIPTIONS, type SeniorityLevel } from '@shared/seniority'
import SeniorityQuiz from './SeniorityQuiz'
import { Sparkles } from 'lucide-react'

const ORDER: SeniorityLevel[] = ['intern', 'junior', 'mid', 'senior']

export default function Seniority() {
  const setDraft = useOnboarding((s) => s.setDraft)
  const draft = useOnboarding((s) => s.draft)
  const goNext = useOnboarding((s) => s.goNext)
  const [mode, setMode] = useState<'choose' | 'manual' | 'quiz'>('choose')

  if (mode === 'quiz') {
    return (
      <SeniorityQuiz
        onResult={(level) => {
          setDraft('seniority', level)
          setDraft('seniority_source', 'quiz')
          goNext()
        }}
        onCancel={() => setMode('choose')}
      />
    )
  }

  if (mode === 'choose') {
    return (
      <Shell title="Qual seu nível?" subtitle="Isso ajusta a profundidade das explicações da IA." hideNext>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 480 }}>
          <button
            onClick={() => setMode('manual')}
            className="step-card"
            style={{ textAlign: 'left' }}
          >
            <div className="step-card-title">Selecionar manualmente</div>
            <div className="step-card-desc">Escolho meu nível direto.</div>
          </button>
          <button
            onClick={() => setMode('quiz')}
            className="step-card"
            style={{ textAlign: 'left' }}
          >
            <div className="step-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} strokeWidth={1.5} style={{ color: 'rgba(167,139,250,1)' }} />
              Fazer um quiz rápido (8 perguntas)
            </div>
            <div className="step-card-desc">A IA estima seu nível pelas respostas. Você pode mudar depois.</div>
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell
      title="Selecione seu nível"
      subtitle={draft.seniority_source === 'quiz' ? 'Sugestão do quiz já marcada — pode ajustar.' : undefined}
      nextDisabled={!draft.seniority}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 480 }}>
        {ORDER.map((level) => {
          const selected = draft.seniority === level
          return (
            <button
              key={level}
              onClick={() => {
                setDraft('seniority', level)
                if (draft.seniority_source !== 'quiz') setDraft('seniority_source', 'manual')
              }}
              className={`step-card ${selected ? 'step-card-selected' : ''}`}
              style={{ textAlign: 'left' }}
            >
              <div className="step-card-title">{SENIORITY_LABELS[level]}</div>
              <div className="step-card-desc">{SENIORITY_DESCRIPTIONS[level]}</div>
            </button>
          )
        })}
      </div>
      <button
        onClick={() => setMode('choose')}
        style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ← refazer escolha do método
      </button>
    </Shell>
  )
}
