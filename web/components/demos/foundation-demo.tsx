'use client'
import { motion } from 'framer-motion'

const PROVIDERS = ['Claude', 'Codex', 'Gemini', 'Aider', 'Ollama']

export function FoundationDemo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PROVIDERS.map((name, i) => (
          <motion.span
            key={name}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: [0.25, 1, 1, 0.25] }}
            transition={{
              duration: 2.5,
              delay: i * 0.4,
              repeat: Infinity,
              times: [0, 0.25, 0.7, 1],
              ease: 'easeInOut',
            }}
            className="px-2.5 py-1 rounded-md bg-card border border-border font-mono text-[10px] uppercase tracking-widest text-foreground/85"
          >
            {name}
          </motion.span>
        ))}
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/[0.08] font-mono text-[10px] uppercase tracking-widest text-primary">
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />
          <span className="relative size-1.5 rounded-full bg-primary" />
        </span>
        100% local · BYOK
      </div>
    </div>
  )
}
