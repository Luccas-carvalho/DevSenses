'use client'
import { useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  ariaLabel: string
}

export function DemoPlayer({ children, className, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '-10% 0px' })

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      data-playing={inView ? 'true' : 'false'}
      className={
        className ??
        'relative w-full rounded-2xl border border-border bg-card/70 backdrop-blur-md p-4 overflow-hidden'
      }
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent pointer-events-none" />
      {inView && children}
    </div>
  )
}
