'use client'
import { useEffect, useRef } from 'react'
import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion'

type Props = {
  value: number
  duration?: number
  className?: string
  format?: (n: number) => string
}

export function NumberCounter({ value, duration = 1.4, className, format }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (latest) => Math.round(latest))
  const display = useTransform(rounded, (n) => (format ? format(n) : n.toLocaleString('pt-BR')))

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionVal, value, { duration, ease: [0.16, 1, 0.3, 1] })
    return controls.stop
  }, [inView, value, duration, motionVal])

  return <motion.span ref={ref} className={className}>{display}</motion.span>
}
