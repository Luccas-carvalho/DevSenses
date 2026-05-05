'use client'

import { motion } from 'framer-motion'
import { Stagger, staggerItem } from '@/components/animations/stagger'
import { GitCompare, Brain, Cpu, GraduationCap } from 'lucide-react'

const ICONS = [GitCompare, Brain, Cpu, GraduationCap]

type Item = { title: string; description: string }

export function FeaturesGrid({ items }: { items: Item[] }) {
  return (
    <Stagger className="grid sm:grid-cols-2 gap-4 mt-12">
      {items.map((item, i) => {
        const Icon = ICONS[i] ?? GitCompare
        return (
          <motion.div
            key={i}
            variants={staggerItem}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="group relative p-6 rounded-xl border border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition-colors overflow-hidden"
          >
            <div className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        )
      })}
    </Stagger>
  )
}
