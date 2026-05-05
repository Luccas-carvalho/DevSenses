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
          <motion.div key={i} variants={staggerItem} whileHover={{ y: -3 }} transition={{ duration: 0.15 }}
            className="group p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        )
      })}
    </Stagger>
  )
}
