import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { AnimatedDiffDemo } from '@/components/animated-diff-demo'
export async function Solution() {
  const t = await getTranslations('solution')
  const explanation = t.raw('demo_explanation') as string[]
  return (
    <section id="features" className="relative px-6 py-28 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <FadeIn><h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">{t('title')}</h2></FadeIn>
          <FadeIn delay={0.1}><p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">{t('sub')}</p></FadeIn>
        </div>
        <FadeIn delay={0.2}>
          <AnimatedDiffDemo diff={t('demo_diff')} explanation={explanation} label={t('demo_label')} />
        </FadeIn>
      </div>
    </section>
  )
}
