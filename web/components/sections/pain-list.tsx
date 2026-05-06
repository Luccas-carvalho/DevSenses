'use client'
import { motion } from 'framer-motion'
import { Stagger, staggerItem } from '@/components/animations/stagger'

export function PainList({ items }: { items: string[] }) {
  return (
    <div className="mt-12 rounded-xl border border-border bg-foreground/[0.02] dark:bg-black/30 overflow-hidden shadow-[0_8px_32px_-12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-foreground/[0.03] dark:bg-black/40">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-yellow-500/70" />
        <span className="size-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 font-mono text-[11px] text-muted-foreground tracking-wider">~ tail -f your-life.log</span>
      </div>
      <Stagger className="font-mono text-[13px] sm:text-sm divide-y divide-border/50">
        {items.map((b, i) => (
          <motion.div
            key={i}
            variants={staggerItem}
            className="group flex items-start gap-3 px-5 py-3.5 hover:bg-destructive/[0.04] transition-colors"
          >
            <span className="shrink-0 text-muted-foreground/60 select-none w-6">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="shrink-0 text-destructive font-bold tracking-wider">[ERROR]</span>
            <span className="text-foreground/90">{b}</span>
          </motion.div>
        ))}
        <motion.div
          variants={staggerItem}
          className="flex items-center gap-3 px-5 py-3 text-muted-foreground/70"
        >
          <span className="text-emerald-500 font-bold">$</span>
          <span className="inline-block w-2.5 h-4 bg-foreground/70 animate-pulse" />
        </motion.div>
      </Stagger>
    </div>
  )
}
