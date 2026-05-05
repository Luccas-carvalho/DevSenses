'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = HTMLMotionProps<'div'> & {
  children: ReactNode
  delay?: number
  y?: number
  once?: boolean
}

export function FadeIn({
  children,
  delay = 0,
  y = 24,
  once = true,
  ...rest
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
