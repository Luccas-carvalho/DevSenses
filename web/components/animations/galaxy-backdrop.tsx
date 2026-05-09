'use client'
import { useMemo } from 'react'

type Star = { left: string; top: string; size: number; delay: number; duration: number; bright: boolean }

function makeStars(count: number, seed: number): Star[] {
  const out: Star[] = []
  let s = seed
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  for (let i = 0; i < count; i++) {
    out.push({
      left: `${(rnd() * 100).toFixed(2)}%`,
      top: `${(rnd() * 100).toFixed(2)}%`,
      size: rnd() < 0.85 ? 1 : rnd() < 0.7 ? 2 : 3,
      delay: rnd() * 6,
      duration: 3 + rnd() * 5,
      bright: rnd() < 0.18,
    })
  }
  return out
}

export function GalaxyBackdrop({ density = 'normal' }: { density?: 'sparse' | 'normal' | 'dense' }) {
  const count = density === 'dense' ? 140 : density === 'sparse' ? 40 : 80
  const stars = useMemo(() => makeStars(count, 1337), [count])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_85%_75%_at_50%_40%,black_30%,transparent_95%)]">
      {/* Nebulae — large soft purple clouds drifting */}
      <div className="ds-galaxy-nebula ds-galaxy-nebula-1" />
      <div className="ds-galaxy-nebula ds-galaxy-nebula-2" />
      <div className="ds-galaxy-nebula ds-galaxy-nebula-3" />

      {/* Concentric orbital rings around hero center */}
      <div className="ds-galaxy-orbit ds-galaxy-orbit-1" />
      <div className="ds-galaxy-orbit ds-galaxy-orbit-2" />
      <div className="ds-galaxy-orbit ds-galaxy-orbit-3" />

      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <span
            key={i}
            className={`ds-galaxy-star ${star.bright ? 'is-bright' : ''}`}
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay.toFixed(2)}s`,
              animationDuration: `${star.duration.toFixed(2)}s`,
            }}
          />
        ))}
      </div>

      {/* Sun rays behind center */}
      <div className="ds-galaxy-rays" />
    </div>
  )
}
