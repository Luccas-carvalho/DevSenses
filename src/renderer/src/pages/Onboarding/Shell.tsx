import { type ReactNode, useEffect, useState, useMemo, useCallback } from 'react'
import { useOnboarding, STEP_ORDER } from '@/stores/onboarding'
import { AlertTriangle } from 'lucide-react'
import type React from 'react'
import './onboarding.css'

interface Props {
  children: ReactNode
  title: string
  subtitle?: string
  onNext?: () => Promise<void> | void
  nextLabel?: string
  nextDisabled?: boolean
  hidePrev?: boolean
  hideNext?: boolean
}

const TOTAL_STEPS = STEP_ORDER.length // 8 steps: welcome, name, seniority, providers, test, theme, workspace, summary

function SymbolPattern(): React.ReactElement {
  const symbols = ['>', '>_', '{}', '()', '[]', '//', '→', '◇', '○', '·', '+', '01', '10', '<>', ';;']
  const rows = 22
  const cols = 32

  const elements = useMemo(() => {
    const els: React.ReactElement[] = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const sym = symbols[(row * 7 + col * 3) % symbols.length]
        const x = (col / cols) * 100
        const y = (row / rows) * 100
        const opacity = 0.06 + Math.sin(row * 0.4 + col * 0.25) * 0.03
        els.push(
          <text
            key={`${row}-${col}`}
            x={`${x}%`}
            y={`${y}%`}
            fill={`rgba(255, 255, 255, ${opacity})`}
            fontSize="10"
            fontFamily="SF Mono, Monaco, Menlo, monospace"
            fontWeight="400"
          >
            {sym}
          </text>
        )
      }
    }
    return els
  }, [])

  return (
    <div className="onboarding-pattern">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {elements}
      </svg>
    </div>
  )
}

export function Shell({
  children,
  title,
  subtitle,
  onNext,
  nextLabel = 'Continuar',
  nextDisabled,
  hidePrev,
  hideNext,
}: Props): React.ReactElement {
  const { step, goNext, goPrev, setCosmic } = useOnboarding()
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [isAnimating, setIsAnimating] = useState(false)
  const [skipOpen, setSkipOpen] = useState(false)

  const stepIndex = STEP_ORDER.indexOf(step)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === TOTAL_STEPS - 1

  const triggerNext = useCallback(async () => {
    if (isAnimating || nextDisabled || hideNext) return
    if (onNext) await onNext()
    setPhase('exiting')
    setIsAnimating(true)
    setTimeout(() => {
      goNext()
      setPhase('entering')
      setTimeout(() => {
        setPhase('idle')
        setIsAnimating(false)
      }, 500)
    }, 300)
  }, [isAnimating, nextDisabled, hideNext, onNext, goNext])

  const triggerPrev = useCallback(() => {
    if (isAnimating || hidePrev || isFirstStep) return
    setPhase('exiting')
    setIsAnimating(true)
    setTimeout(() => {
      goPrev()
      setPhase('entering')
      setTimeout(() => {
        setPhase('idle')
        setIsAnimating(false)
      }, 500)
    }, 300)
  }, [isAnimating, hidePrev, isFirstStep, goPrev])

  async function confirmSkip(): Promise<void> {
    setSkipOpen(false)
    await window.api.invoke('settings:set', { key: 'onboarding_completed', value: true })
    setCosmic(true)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Enter' && !nextDisabled && !hideNext && !isAnimating) {
        e.preventDefault()
        void triggerNext()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [triggerNext, nextDisabled, hideNext, isAnimating])

  return (
    <div className="onboarding-root" data-step={stepIndex}>
      <SymbolPattern />
      <div className="onboarding-titlebar" />

      {!isLastStep && (
        <button onClick={() => setSkipOpen(true)} className="onboarding-skip">
          Pular
        </button>
      )}

      {skipOpen && (
        <div className="onboarding-modal-backdrop" onClick={() => setSkipOpen(false)}>
          <div className="onboarding-modal" onClick={(e) => e.stopPropagation()}>
            <div className="onboarding-modal-icon">
              <AlertTriangle size={22} />
            </div>
            <h2 className="onboarding-modal-title">Pular configuração?</h2>
            <p className="onboarding-modal-desc">
              DevSenses funciona melhor configurado. Pular significa <b>nenhuma CLI selecionada</b> e <b>modo júnior padrão</b>.
            </p>
            <p className="onboarding-modal-hint">Sempre dá pra ajustar nas Settings depois.</p>
            <div className="onboarding-modal-actions">
              <button className="onboarding-modal-cancel" onClick={() => setSkipOpen(false)}>
                Continuar configurando
              </button>
              <button className="onboarding-modal-confirm" onClick={() => void confirmSkip()}>
                Pular mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="onboarding-content">
        <div
          className={`onboarding-step-wrapper ${
            phase === 'exiting' ? 'step-fade-out' : 'step-fade-in'
          }`}
        >
          <h1 className="step-title">{title}</h1>
          {subtitle && <p className="step-description">{subtitle}</p>}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '32px' }}>
            {children}
          </div>
        </div>
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-nav">
          {!hidePrev && !isFirstStep && (
            <button onClick={triggerPrev} className="onboarding-btn-back">
              Voltar
            </button>
          )}
          {!hideNext && (
            <button
              onClick={() => void triggerNext()}
              disabled={nextDisabled || isAnimating}
              className="onboarding-btn-next"
            >
              {nextLabel}
            </button>
          )}
        </div>

        <div className="onboarding-indicators">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <button
              key={index}
              className={`onboarding-dot ${index === stepIndex ? 'onboarding-dot-active' : ''}`}
              aria-label={`Passo ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
