'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

type Props = {
  diff: string
  explanation: string[]
  label: string
}

export function AnimatedDiffDemo({ diff, explanation, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [activeLine, setActiveLine] = useState(-1)

  useEffect(() => {
    if (!inView) return
    let current = 0
    const interval = setInterval(() => {
      setActiveLine(current)
      current += 1
      if (current >= explanation.length) clearInterval(interval)
    }, 1200)
    return () => clearInterval(interval)
  }, [inView, explanation.length])

  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-4 rounded-xl border border-border bg-background/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-muted/50 p-6 font-mono text-sm">
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-red-500/60" />
            <span className="size-3 rounded-full bg-yellow-500/60" />
            <span className="size-3 rounded-full bg-green-500/60" />
          </div>
          <span className="ml-auto">{label}</span>
        </div>
        <pre className="whitespace-pre-wrap leading-relaxed">
          {diff.split('\n').map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('+')
                  ? 'text-green-500'
                  : line.startsWith('-')
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }
            >
              {line}
            </div>
          ))}
        </pre>
      </div>

      <div className="p-6 flex flex-col gap-3">
        <AnimatePresence>
          {explanation.slice(0, activeLine + 1).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-foreground leading-relaxed"
            >
              <span className="text-primary font-mono mr-2">{`>`}</span>
              {line}
            </motion.p>
          ))}
        </AnimatePresence>
        {activeLine < explanation.length - 1 && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="size-2 bg-primary rounded-full"
          />
        )}
      </div>
    </div>
  )
}
