import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { FeaturesGrid } from './features-grid'

type Item = { title: string; description: string }

export async function Features() {
  const t = await getTranslations('features')
  const items = t.raw('items') as Item[]

  return (
    <section className="relative px-6 py-32 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
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
        <FeaturesGrid items={items} />
      </div>
    </section>
  )
}
