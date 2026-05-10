'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export function AppShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 1], [10, 0, -4])
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.94, 1, 0.98])

  return (
    <div ref={ref} className="relative w-full max-w-[1100px] mx-auto" style={{ perspective: 1400 }}>
      <div aria-hidden className="absolute -inset-12 rounded-[40px] bg-primary/15 blur-[60px] pointer-events-none" />
      <div aria-hidden className="absolute -inset-2 rounded-[28px] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-2xl pointer-events-none" />

      <motion.div
        style={{ rotateX, scale, transformStyle: 'preserve-3d' }}
        className="relative rounded-2xl border border-border/60 bg-card/95 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.6),0_0_0_1px_hsl(var(--border)/0.5)] overflow-hidden backdrop-blur-xl"
      >
        <img
          src="/screenshots/project-diff.png"
          alt="DevSenses — diff explicado linha por linha com quiz adaptativo"
          loading="eager"
          className="block w-full h-auto"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="hidden md:flex absolute -top-4 left-1/2 -translate-x-1/2 items-center gap-2 px-3 py-1.5 rounded-full bg-card/95 border border-primary/40 backdrop-blur-md shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] text-[11px] font-mono whitespace-nowrap"
      >
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-foreground">100% local · BYOK</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="hidden md:flex absolute -bottom-4 left-1/2 -translate-x-1/2 items-center gap-2 px-3 py-1.5 rounded-full bg-card/95 border border-primary/40 backdrop-blur-md shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] text-[11px] font-mono whitespace-nowrap"
      >
        <kbd className="text-primary font-bold">⌘K</kbd>
        <span className="text-foreground">cheat sheet em qualquer trecho</span>
      </motion.div>
    </div>
  )
}
