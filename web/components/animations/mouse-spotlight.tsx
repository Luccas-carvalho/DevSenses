'use client'
import { useEffect, useRef } from 'react'

type Variant = 'spot' | 'smoke'

export function MouseSpotlight({
  size = 600,
  opacity = 0.15,
  variant = 'spot',
}: {
  size?: number
  opacity?: number
  variant?: Variant
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0

    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.parentElement!.getBoundingClientRect()
      tx = e.clientX - rect.left
      ty = e.clientY - rect.top
    }

    const tick = () => {
      cx += (tx - cx) * 0.12
      cy += (ty - cy) * 0.12
      const el = ref.current
      if (el) el.style.transform = `translate3d(${cx - size / 2}px, ${cy - size / 2}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const parent = ref.current?.parentElement
    parent?.addEventListener('mousemove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      parent?.removeEventListener('mousemove', onMove)
    }
  }, [size])

  if (variant === 'smoke') {
    return (
      <div
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 will-change-transform mix-blend-screen"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-0 rounded-full blur-3xl ds-smoke-breathe"
          style={{
            background: `radial-gradient(circle at 50% 50%, hsl(var(--primary) / ${opacity}) 0%, transparent 65%)`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full blur-2xl ds-smoke-breathe"
          style={{
            background: `radial-gradient(circle at 45% 55%, hsl(var(--primary) / ${opacity * 0.7}) 0%, transparent 60%)`,
            animationDelay: '-1.2s',
            transform: 'translate(-30px, 20px)',
          }}
        />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 rounded-full blur-3xl will-change-transform"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, hsl(var(--primary) / ${opacity}) 0%, transparent 70%)`,
      }}
    />
  )
}
