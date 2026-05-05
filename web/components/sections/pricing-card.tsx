'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

export type PricingPlan = {
  id: string
  name: string
  badge?: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  limit?: string
  highlight?: boolean
}

type Props = {
  plan: PricingPlan
  used?: number
}

export function PricingCard({ plan, used = 0 }: Props) {
  const limitText = plan.limit?.replace('{used}', String(100 - used))

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative p-8 rounded-2xl border bg-muted/20 flex flex-col',
        plan.highlight
          ? 'border-primary shadow-[0_0_50px_-10px_rgba(102,24,237,0.4)]'
          : 'border-border'
      )}
    >
      {plan.badge && (
        <Badge
          variant={plan.highlight ? 'default' : 'secondary'}
          className={cn(
            'absolute -top-3 left-6',
            plan.highlight && 'bg-primary text-primary-foreground'
          )}
        >
          {plan.badge}
        </Badge>
      )}

      <h3 className="text-xl font-semibold">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

      <div className="mt-6">
        <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
        <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
      </div>

      <ul className="mt-8 space-y-3 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check size={16} className="text-primary shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {limitText && (
        <p className="mt-6 text-xs font-mono text-primary">{limitText}</p>
      )}

      <Button
        className="mt-6 w-full"
        variant={plan.highlight ? 'default' : 'outline'}
        size="lg"
      >
        {plan.cta}
      </Button>
    </motion.div>
  )
}
