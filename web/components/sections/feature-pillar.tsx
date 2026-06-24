'use client'
import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { Stagger, staggerItem } from '@/components/animations/stagger'
import { Icon } from '@/components/icon'
import { DemoPlayer } from '@/components/animations/demo-player'

type Item = { icon: string; title: string; description: string }
type Pillar = { id: string; label: string; title: string; description: string; items: Item[] }

export function FeaturePillar({
  pillar,
  flipped,
  index,
  demo,
  demoAriaLabel,
}: {
  pillar: Pillar
  flipped: boolean
  index: number
  demo: ReactNode
  demoAriaLabel: string
}) {
  return (
    <div className="grid lg:grid-cols-[0.9fr_1.3fr] gap-10 lg:gap-14 items-start">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className={`relative ${flipped ? 'lg:order-2' : ''}`}
      >
        <div className="flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/[0.06] backdrop-blur-md">
            <span className="font-mono text-[10px] font-bold text-primary tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary/90">
              {pillar.label}
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold tracking-[-0.05em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            {pillar.title}
          </h3>
          <p className="text-base text-muted-foreground leading-relaxed text-balance">
            {pillar.description}
          </p>
          <DemoPlayer ariaLabel={demoAriaLabel} className="relative w-full rounded-2xl border border-border bg-card/70 backdrop-blur-md p-5 overflow-hidden mt-2">
            {demo}
          </DemoPlayer>
        </div>
      </motion.div>

      <Stagger className={`grid sm:grid-cols-2 gap-4 ${flipped ? 'lg:order-1' : ''}`}>
        {pillar.items.map((item) => (
          <motion.div
            key={item.title}
            variants={staggerItem}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.16 }}
            className="group relative p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4 shadow-[0_0_18px_-6px_hsl(var(--primary)/0.4)] group-hover:bg-primary/15 group-hover:border-primary/40 transition-colors">
                <Icon name={item.icon} size={18} />
              </div>
              <h4 className="font-semibold tracking-tight text-base">{item.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </Stagger>
    </div>
  )
}
