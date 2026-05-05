'use client'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Stagger, staggerItem } from '@/components/animations/stagger'
export function PainList({ items }: { items: string[] }) {
  return (
    <Stagger className="mt-10 grid gap-3">
      {items.map((b, i) => (
        <motion.div key={i} variants={staggerItem}
          className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
          <div className="shrink-0 mt-0.5 size-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <X size={14} strokeWidth={2.5} />
          </div>
          <p className="text-base">{b}</p>
        </motion.div>
      ))}
    </Stagger>
  )
}
