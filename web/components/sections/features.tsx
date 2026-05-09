import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { FeaturePillar } from './feature-pillar'

type Item = { icon: string; title: string; description: string }
type Pillar = { id: string; label: string; title: string; description: string; items: Item[] }

export async function Features() {
  const t = await getTranslations('features')
  const pillars = t.raw('pillars') as Pillar[]
  return (
    <section id="features" className="relative px-6 py-32 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.18] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          <FadeIn><SectionLabel number="04" className="mb-5">{t('subtitle')}</SectionLabel></FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.035em] text-balance bg-gradient-to-br from-foreground to-foreground/55 bg-clip-text text-transparent pb-1">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <div className="flex flex-col gap-24">
          {pillars.map((pillar, i) => (
            <FeaturePillar key={pillar.id} pillar={pillar} flipped={i % 2 === 1} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
