'use client'
import { useEffect, useRef } from 'react'

type Wisp = {
  baseAngle: number
  angularSpeed: number
  baseLen: number
  lenAmp: number
  lenSpeed: number
  lenPhase: number
  baseAlpha: number
  alphaSpeed: number
  alphaPhase: number
  width: number
}

type Props = {
  wispCount?: number
  className?: string
}

export function CursorSmoke({ wispCount = 22, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    let dpr = window.devicePixelRatio || 1
    let width = 0
    let height = 0
    let raf = 0
    let running = true
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0
    let hasTarget = false

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!hasTarget) {
        tx = width / 2
        ty = height * 0.42
        cx = tx
        cy = ty
      }
    }

    const wisps: Wisp[] = Array.from({ length: wispCount }, (_, i) => {
      const angle = (i / wispCount) * Math.PI * 2 + Math.random() * 0.4
      return {
        baseAngle: angle,
        angularSpeed: (Math.random() - 0.5) * 0.0007,
        baseLen: 180 + Math.random() * 220,
        lenAmp: 60 + Math.random() * 80,
        lenSpeed: 0.0008 + Math.random() * 0.0014,
        lenPhase: Math.random() * Math.PI * 2,
        baseAlpha: 0.16 + Math.random() * 0.22,
        alphaSpeed: 0.0012 + Math.random() * 0.0018,
        alphaPhase: Math.random() * Math.PI * 2,
        width: 4 + Math.random() * 14,
      }
    })

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      tx = e.clientX - rect.left
      ty = e.clientY - rect.top
      hasTarget = true
    }

    const start = performance.now()

    const tick = () => {
      if (!running) {
        raf = 0
        return
      }
      const now = performance.now()
      const t = now - start

      // smooth follow
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08

      ctx.clearRect(0, 0, width, height)

      // additive blending so overlapping wisps brighten
      ctx.globalCompositeOperation = 'lighter'

      // central core glow — small, bright
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 110)
      coreGrad.addColorStop(0, 'hsla(258, 100%, 88%, 0.55)')
      coreGrad.addColorStop(0.35, 'hsla(258, 95%, 72%, 0.22)')
      coreGrad.addColorStop(1, 'hsla(258, 95%, 66%, 0)')
      ctx.fillStyle = coreGrad
      ctx.beginPath()
      ctx.arc(cx, cy, 110, 0, Math.PI * 2)
      ctx.fill()

      // wisps — tapered rays from cursor
      for (const w of wisps) {
        const angle = w.baseAngle + t * w.angularSpeed + Math.sin(t * 0.0004 + w.lenPhase) * 0.18
        const len = w.baseLen + Math.sin(t * w.lenSpeed + w.lenPhase) * w.lenAmp
        const alpha = Math.max(
          0,
          w.baseAlpha + Math.sin(t * w.alphaSpeed + w.alphaPhase) * w.baseAlpha * 0.7,
        )

        const ex = cx + Math.cos(angle) * len
        const ey = cy + Math.sin(angle) * len

        const grad = ctx.createLinearGradient(cx, cy, ex, ey)
        grad.addColorStop(0, `hsla(258, 100%, 80%, ${alpha})`)
        grad.addColorStop(0.4, `hsla(258, 95%, 70%, ${alpha * 0.45})`)
        grad.addColorStop(1, 'hsla(258, 95%, 66%, 0)')

        ctx.strokeStyle = grad
        ctx.lineWidth = w.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }

      // soft outer halo
      const halo = ctx.createRadialGradient(cx, cy, 60, cx, cy, 320)
      halo.addColorStop(0, 'hsla(258, 90%, 66%, 0.1)')
      halo.addColorStop(1, 'hsla(258, 90%, 66%, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, 320, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalCompositeOperation = 'source-over'

      raf = requestAnimationFrame(tick)
    }

    resize()
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      dpr = window.devicePixelRatio || 1
      resize()
    }
    window.addEventListener('resize', onResize)

    const parent = canvas.parentElement
    parent?.addEventListener('mousemove', onMove)

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          running = entry.isIntersecting
          if (running && !raf) raf = requestAnimationFrame(tick)
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    const onVis = () => {
      running = document.visibilityState === 'visible'
      if (running && !raf) raf = requestAnimationFrame(tick)
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      parent?.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      io.disconnect()
    }
  }, [wispCount])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={
        className ??
        'pointer-events-none absolute inset-0 w-full h-full mix-blend-screen [filter:blur(10px)]'
      }
    />
  )
}
