'use client'
import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'
import { motion, AnimatePresence } from 'framer-motion'
export function AnimatedDiffDemo({ diff, explanation, label }: { diff: string; explanation: string[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState(-1)
  useEffect(() => {
    if (!inView) return
    let i = 0
    const id = setInterval(() => { setActive(i); i++; if (i >= explanation.length) clearInterval(id) }, 1400)
    return () => clearInterval(id)
  }, [inView, explanation.length])
  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-0 rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/50 dark:bg-card p-6 font-mono text-sm">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="size-3 rounded-full bg-destructive/60" />
          <span className="size-3 rounded-full bg-yellow-500/60" />
          <span className="size-3 rounded-full bg-green-500/60" />
          <span className="ml-auto text-xs text-muted-foreground">{label}</span>
        </div>
        <pre className="whitespace-pre-wrap leading-relaxed text-xs">
          {diff.split('\n').map((line, i) => (
            <div key={i} className={line.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>{line}</div>
          ))}
        </pre>
      </div>
      <div className="bg-background p-6 flex flex-col gap-3 min-h-[180px]">
        <AnimatePresence>
          {explanation.slice(0, active + 1).map((line, i) => (
            <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}
              className="text-sm leading-relaxed">
              <span className="text-primary font-mono mr-2">›</span>{line}
            </motion.p>
          ))}
        </AnimatePresence>
        {active < explanation.length - 1 && active >= 0 && (
          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
            className="size-1.5 rounded-full bg-primary" />
        )}
      </div>
    </div>
  )
}
