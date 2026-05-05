'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
export type PricingPlan = { id: string; name: string; badge?: string; price: string; period: string; description: string; features: string[]; cta: string; limit?: string; highlight?: boolean }
export function PricingCard({ plan, used = 0 }: { plan: PricingPlan; used?: number }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.15 }}
      className={cn('relative p-7 rounded-2xl border bg-card flex flex-col', plan.highlight ? 'border-primary shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)]' : 'border-border')}>
      {plan.badge && <Badge variant={plan.highlight ? 'default' : 'secondary'} className="absolute -top-3 left-6">{plan.badge}</Badge>}
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      <div className="mt-5">
        <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
        <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
      </div>
      <ul className="mt-6 space-y-2.5 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check size={15} className="text-primary shrink-0 mt-0.5" />{f}
          </li>
        ))}
      </ul>
      {plan.limit && <p className="mt-5 text-xs font-mono text-primary">{plan.limit.replace('{used}', String(100 - used))}</p>}
      <Button className="mt-5 w-full" variant={plan.highlight ? 'default' : 'outline'} size="lg">{plan.cta}</Button>
    </motion.div>
  )
}
