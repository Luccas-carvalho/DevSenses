import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { PricingCard, type PricingPlan } from './pricing-card'

export async function Pricing() {
  const t = await getTranslations('pricing')
  const plans = t.raw('plans') as PricingPlan[]
  return (
    <section id="pricing" className="relative px-6 py-28 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.15] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
          <FadeIn><SectionLabel number="06" className="mb-5">{t('subtitle')}</SectionLabel></FadeIn>
          <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent pb-1">{t('title')}</h2></FadeIn>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <FadeIn key={plan.id} delay={i * 0.1}><PricingCard plan={plan} /></FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
