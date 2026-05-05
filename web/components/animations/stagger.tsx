'use client'
import { motion } from 'framer-motion'
export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } }
}
export function Stagger({ children, className, staggerDelay = 0.08 }: { children: React.ReactNode; className?: string; staggerDelay?: number }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: staggerDelay } } }}>
      {children}
    </motion.div>
  )
}
