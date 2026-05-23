'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const LEVELS = [
  { label: 'Criança', body: 'Computador esqueceu. Vc lembra ele.' },
  { label: 'Júnior', body: 'useState guarda valor entre renders.' },
  { label: 'Pleno', body: 'Hook que materializa estado local fora do render tree.' },
  { label: 'Sênior', body: 'Closure-stable setter, batched updates, fiber-resident.' },
  { label: 'Algoritmista', body: 'Reconciler armazena em hook linked list, O(1) por dispatch.' },
] as const

export function AdaptiveDemo() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % LEVELS.length), 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center gap-1.5">
        {LEVELS.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i === idx ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Profundidade</span>
        <span className="text-primary">{LEVELS[idx].label}</span>
      </div>
      <div className="relative min-h-[3.5rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-foreground/90 leading-relaxed"
          >
            {LEVELS[idx].body}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
