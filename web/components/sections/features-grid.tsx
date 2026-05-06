'use client'
import { motion } from 'framer-motion'
import { Stagger, staggerItem } from '@/components/animations/stagger'
import { GitCompare, Brain, Cpu, GraduationCap } from 'lucide-react'

const ICONS = [GitCompare, Brain, Cpu, GraduationCap]
type Item = { title: string; description: string }

export function FeaturesGrid({ items }: { items: Item[] }) {
  return (
    <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
      {items.map((item, i) => {
        const Icon = ICONS[i] ?? GitCompare
        return (
          <motion.div
            key={i}
            variants={staggerItem}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.18 }}
            className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors overflow-hidden flex flex-col h-full"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative flex flex-col h-full">
              <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-5 shadow-[0_0_18px_-6px_hsl(var(--primary)/0.4)] group-hover:bg-primary/15 group-hover:border-primary/40 transition-colors">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold tracking-tight text-lg">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        )
      })}
    </Stagger>
  )
}
