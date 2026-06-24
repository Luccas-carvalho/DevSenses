'use client'
import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'

export function AppShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const rotateX = useTransform(scrollYProgress, [0, 0.45, 1], [18, 0, -6])
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.88, 1, 0.96])
  const y = useTransform(scrollYProgress, [0, 0.45], [60, 0])
  const opacity = useTransform(scrollYProgress, [0, 0.25, 1], [0, 1, 1])

  return (
    <div ref={ref} className="relative w-full max-w-[1100px] mx-auto" style={{ perspective: 1600 }}>
      <motion.div
        style={{ rotateX, scale, y, opacity, transformStyle: 'preserve-3d' }}
        className="relative"
      >
        <Image
          src="/screenshots/project-diff.png"
          alt="DevSenses — diff explicado linha por linha com tabs Resumo, Detalhes, Conceitos e Quiz rápido"
          width={2624}
          height={1824}
          priority
          className="block w-full h-auto"
        />
      </motion.div>

      {/* Floating "100% local · BYOK" pill on the website (image itself has no pill) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="hidden md:flex absolute -top-4 left-1/2 -translate-x-1/2 items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-primary/40 backdrop-blur-md shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] text-[11px] font-mono whitespace-nowrap z-[5]"
      >
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-500/60 animate-ping" />
          <span className="relative size-1.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-foreground">100% local · BYOK</span>
      </motion.div>
    </div>
  )
}
