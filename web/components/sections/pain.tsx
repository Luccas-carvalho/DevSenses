import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { PainList } from './pain-list'

export async function Pain() {
  const t = await getTranslations('pain')
  const bullets = t.raw('bullets') as string[]

  return (
    <section className="relative px-6 py-32 border-t border-border">
      <div className="max-w-4xl mx-auto">
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
        <PainList items={bullets} />
      </div>
    </section>
  )
}
