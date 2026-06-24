'use client'
import { motion } from 'framer-motion'

export function PowerDemo() {
  return (
    <div className="relative font-mono text-[13px] leading-[1.7] text-foreground/85 min-h-[180px]">
      <pre className="m-0 whitespace-pre select-none">
{`const cart = items
  .filter((i) => i.active)
  .reduce((acc, x) => {
    return acc + x.price * x.qty
  }, 0)

return formatBRL(cart)`}
      </pre>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.2, 0.85, 1], ease: 'easeInOut' }}
        className="absolute left-0 right-2 top-[2.4em] h-[3em] bg-primary/25 rounded-md pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, -4] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.25, 0.35, 0.85, 1], ease: 'easeOut' }}
        className="absolute left-2 top-[6em] inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-card border border-primary/40 text-[11px] shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.55)]"
      >
        <kbd className="px-1.5 py-0.5 rounded bg-background/80 border border-border text-primary font-semibold">⌘K</kbd>
        <span className="text-foreground/80">Explicar trecho</span>
      </motion.div>
    </div>
  )
}
