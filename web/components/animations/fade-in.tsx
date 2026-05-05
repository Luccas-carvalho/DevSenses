'use client'
import { motion, type HTMLMotionProps } from 'framer-motion'
export function FadeIn({ children, delay = 0, y = 20, once = true, ...rest }: HTMLMotionProps<'div'> & { delay?: number; y?: number; once?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
