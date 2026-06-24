'use client'
import { useEffect, useRef } from 'react'

type Comet = { x: number; y: number; vx: number; vy: number; len: number; alpha: number }

type Props = {
  density?: number
  className?: string
}

export function CanvasField({ density = 10, className }: Props) {
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

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (): Comet => ({
      x: Math.random() * width,
      y: -20 - Math.random() * 200,
      vx: 0.4 + Math.random() * 0.8,
      vy: 0.9 + Math.random() * 1.6,
      len: 60 + Math.random() * 80,
      alpha: 0.4 + Math.random() * 0.45,
    })

    // initial scatter: distribute across whole canvas so opening frame isn't a wall of comets from the top
    const comets: Comet[] = Array.from({ length: density }, () => {
      const s = spawn()
      s.x = Math.random() * width
      s.y = Math.random() * height
      return s
    })

    const tick = () => {
      if (!running) {
        raf = 0
        return
      }
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < comets.length; i++) {
        const c = comets[i]
        c.x += c.vx
        c.y += c.vy
        if (c.y - c.len > height || c.x > width + 50) {
          comets[i] = spawn()
          continue
        }
        const tailX = c.x - c.vx * c.len
        const tailY = c.y - c.vy * c.len
        const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY)
        grad.addColorStop(0, `hsla(258, 90%, 76%, ${c.alpha})`)
        grad.addColorStop(1, 'hsla(258, 90%, 66%, 0)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(c.x, c.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      dpr = window.devicePixelRatio || 1
      resize()
    }
    window.addEventListener('resize', onResize)

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
      document.removeEventListener('visibilitychange', onVis)
      io.disconnect()
    }
  }, [density])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className ?? 'absolute inset-0 w-full h-full pointer-events-none'}
    />
  )
}
