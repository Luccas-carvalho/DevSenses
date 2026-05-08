import { useEffect, useMemo } from 'react'
import Logo from './Logo'
import '@/styles/cosmic-transition.css'

interface Props {
  onComplete: () => void
  durationMs?: number
}

export default function CosmicTransition({
  onComplete,
  durationMs = 4500
}: Props): React.JSX.Element {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(onComplete, reduced ? 600 : durationMs)
    return () => clearTimeout(t)
  }, [onComplete, durationMs])

  const stars = useMemo(() => {
    const els: React.JSX.Element[] = []
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 100
      const y = Math.random() * 100
      const size = 1 + Math.random() * 2.5
      const delay = Math.random() * 0.6
      const isWarp = i % 3 === 0
      const isBright = i % 7 === 0
      els.push(
        <div
          key={i}
          className={`cosmic-star${isWarp ? ' warp' : ''}${isBright ? ' bright' : ''}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            animationDelay: `${delay}s`
          }}
        />
      )
    }
    return els
  }, [])

  return (
    <div
      className="cosmic-root"
      role="status"
      aria-live="polite"
      aria-label="Iniciando DevSenses"
    >
      <div className="cosmic-bg-overlay" />

      <div className="cosmic-nebula cosmic-nebula-1" />
      <div className="cosmic-nebula cosmic-nebula-2" />
      <div className="cosmic-nebula cosmic-nebula-3" />

      <div className="cosmic-stars">{stars}</div>

      <div className="cosmic-orbit cosmic-orbit-1" />
      <div className="cosmic-orbit cosmic-orbit-2" />
      <div className="cosmic-orbit cosmic-orbit-3" />
      <div className="cosmic-orbit cosmic-orbit-4" />

      <div className="cosmic-orbital-dot cosmic-orbital-dot-1" />
      <div className="cosmic-orbital-dot cosmic-orbital-dot-2" />
      <div className="cosmic-orbital-dot cosmic-orbital-dot-3" />

      <div className="cosmic-logo-wrapper">
        <div className="cosmic-logo-glow" />
        <Logo size={128} className="cosmic-logo-img" />
      </div>

      <div className="cosmic-dissolve" />
    </div>
  )
}
