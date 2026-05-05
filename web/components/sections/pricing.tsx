import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { PricingCard, type PricingPlan } from './pricing-card'

export async function Pricing() {
  const t = await getTranslations('pricing')
  const plans = t.raw('plans') as PricingPlan[]

  // hardcoded — backend de venda real vem depois
  const used = 0

  return (
    <section id="pricing" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
              {t('subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <FadeIn key={plan.id} delay={i * 0.1}>
              <PricingCard plan={plan} used={used} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
