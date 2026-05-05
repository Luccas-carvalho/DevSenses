'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
export function GradientBlob({ className }: { className?: string }) {
  return (
    <motion.div aria-hidden
      className={cn('pointer-events-none absolute rounded-full blur-3xl opacity-30 bg-primary', className)}
      animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
      transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity }}
    />
  )
}
