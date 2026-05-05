'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

type Props = {
  className?: string
}

export function GradientBlob({ className }: Props) {
  return (
    <motion.div
      aria-hidden
      className={cn(
        'pointer-events-none absolute rounded-full blur-3xl opacity-40',
        'bg-gradient-to-br from-[#6618ed] to-[#a855f7]',
        className
      )}
      animate={{
        x: [0, 40, -20, 0],
        y: [0, -30, 20, 0],
        scale: [1, 1.1, 0.95, 1]
      }}
      transition={{
        duration: 18,
        ease: 'easeInOut',
        repeat: Infinity
      }}
    />
  )
}
