'use client'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
export type PricingPlan = { id: string; name: string; badge?: string; price: string; period: string; description: string; features: string[]; cta: string; limit?: string; highlight?: boolean }
export function PricingCard({ plan, used = 0 }: { plan: PricingPlan; used?: number }) {
  const body = (
    <>
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      <div className="mt-5">
        <span className={cn(
          'text-5xl font-bold tracking-[-0.04em]',
          plan.highlight && 'bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent'
        )}>
          {plan.price}
        </span>
        <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>
      </div>
      <ul className="mt-6 space-y-2.5 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="shrink-0 mt-0.5 size-4 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Check size={10} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      {plan.limit && (
        <p className="mt-5 text-xs font-mono text-primary uppercase tracking-widest">
          {plan.limit.replace('{used}', String(100 - used))}
        </p>
      )}
      <Button
        className={cn(
          'mt-5 w-full',
          plan.highlight && 'shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)]'
        )}
        variant={plan.highlight ? 'default' : 'outline'}
        size="lg"
      >
        {plan.cta}
      </Button>
    </>
  )

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'relative rounded-2xl flex flex-col',
        plan.highlight && 'shadow-[0_0_60px_-12px_hsl(var(--primary)/0.45)]'
      )}
    >
      {plan.badge && (
        <Badge
          variant={plan.highlight ? 'default' : 'secondary'}
          className={cn(
            'absolute -top-3 left-6 z-20 font-mono text-[10px] uppercase tracking-widest',
            plan.highlight && 'shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]'
          )}
        >
          {plan.badge}
        </Badge>
      )}

      {plan.highlight ? (
        <div
          className="rounded-2xl p-[1.5px] flex flex-col h-full"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--primary) / 0.7) 0%, hsl(var(--primary) / 0.2) 35%, hsl(var(--primary) / 0.5) 65%, hsl(var(--primary) / 0.8) 100%)',
          }}
        >
          <div className="relative p-7 rounded-[14px] bg-gradient-to-b from-primary/[0.05] to-card flex flex-col h-full w-full">
            {body}
          </div>
        </div>
      ) : (
        <div className="relative p-7 rounded-2xl border border-border bg-card flex flex-col h-full">
          {body}
        </div>
      )}
    </motion.div>
  )
}
