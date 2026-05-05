'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Stagger, staggerItem } from '@/components/animations/stagger'

export function PainList({ items }: { items: string[] }) {
  return (
    <Stagger className="mt-12 grid gap-4">
      {items.map((b, i) => (
        <motion.div
          key={i}
          variants={staggerItem}
          className="group flex items-start gap-4 p-5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-colors"
        >
          <div className="shrink-0 mt-0.5 size-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <X size={16} strokeWidth={2.5} />
          </div>
          <p className="text-lg text-foreground">{b}</p>
        </motion.div>
      ))}
    </Stagger>
  )
}
