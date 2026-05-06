'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const CODE_LINES: { n: number; t: string; kind?: 'add' | 'del' | 'plain' }[] = [
  { n: 1, t: 'export function useDebounce<T>(', kind: 'plain' },
  { n: 2, t: '  value: T,', kind: 'plain' },
  { n: 3, t: '  delay = 300', kind: 'plain' },
  { n: 4, t: ') {', kind: 'plain' },
  { n: 5, t: '  const [v, setV] = useState(value)', kind: 'add' },
  { n: 6, t: '  useEffect(() => {', kind: 'add' },
  { n: 7, t: '    const id = setTimeout(...)', kind: 'add' },
  { n: 8, t: '    return () => clearTimeout(id)', kind: 'add' },
  { n: 9, t: '  }, [value, delay])', kind: 'add' },
  { n: 10, t: '  return v', kind: 'plain' },
  { n: 11, t: '}', kind: 'plain' },
]

const EXPLAIN = 'useEffect com cleanup. setTimeout adia o update; clearTimeout cancela se value mudar antes do delay. Padrão clássico de debounce.'

export function HeroMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!inView) return
    let i = 0
    const id = setInterval(() => {
      setTyped(EXPLAIN.slice(0, i))
      i++
      if (i > EXPLAIN.length) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
  }, [inView])

  return (
    <div ref={ref} className="relative w-full max-w-[560px] mx-auto">
      {/* Glow halo */}
      <div aria-hidden className="absolute -inset-8 rounded-3xl bg-primary/15 blur-3xl pointer-events-none" />

      {/* Top: code panel */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 12 }}
        animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-yellow-500/60" />
          <span className="size-2.5 rounded-full bg-green-500/60" />
          <span className="ml-3 text-[11px] font-mono text-muted-foreground">use-debounce.ts</span>
          <span className="ml-auto text-[10px] font-mono text-primary uppercase tracking-widest flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary animate-flicker" />
            git diff
          </span>
        </div>

        {/* Code lines */}
        <div className="font-mono text-[12px] leading-[1.7] py-3">
          {CODE_LINES.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.04 }}
              className={
                'flex gap-3 px-4 py-px ' +
                (line.kind === 'add'
                  ? 'bg-green-500/10 border-l-2 border-green-500/60'
                  : line.kind === 'del'
                  ? 'bg-destructive/10 border-l-2 border-destructive/60'
                  : 'border-l-2 border-transparent')
              }
            >
              <span className="text-muted-foreground/50 w-5 text-right select-none">{line.n}</span>
              <span className={
                line.kind === 'add'
                  ? 'text-green-400'
                  : line.kind === 'del'
                  ? 'text-destructive'
                  : 'text-foreground/85'
              }>
                {line.kind === 'add' ? '+ ' : line.kind === 'del' ? '- ' : '  '}
                {line.t}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Connector line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.9 }}
        className="mx-auto w-px h-6 bg-gradient-to-b from-primary/60 to-primary/20 origin-top"
      />

      {/* Bottom: AI explanation panel */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="relative rounded-xl border border-primary/30 bg-gradient-to-b from-primary/[0.04] to-card/90 backdrop-blur-xl shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)] overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/20">
          <div className="size-5 rounded-md bg-primary/15 border border-primary/30 text-primary flex items-center justify-center">
            <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4 L2 8 L5 12" /><path d="M11 4 L14 8 L11 12" /><path d="M9 3 L7 13" />
            </svg>
          </div>
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">DevSenses · explicação</span>
        </div>
        <div className="px-4 py-3 text-[13px] leading-relaxed text-foreground/90 min-h-[60px]">
          {typed}
          {typed.length < EXPLAIN.length && (
            <span className="inline-block w-[7px] h-[14px] bg-primary ml-0.5 align-middle animate-flicker" />
          )}
        </div>
      </motion.div>

      {/* Floating tags */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.4 }}
        className="absolute -top-3 -right-3 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-mono uppercase tracking-widest shadow-[0_0_20px_-4px_rgb(34_197_94/0.5)]"
      >
        + 5 lines
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.6 }}
        className="absolute -bottom-3 -left-3 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono uppercase tracking-widest shadow-[0_0_20px_-4px_hsl(var(--primary)/0.5)]"
      >
        ai · live
      </motion.div>
    </div>
  )
}
