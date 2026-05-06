import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { FeaturesGrid } from './features-grid'
type Item = { title: string; description: string }
export async function Features() {
  const t = await getTranslations('features')
  const items = t.raw('items') as Item[]
  return (
    <section id="features" className="relative px-6 py-28 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="relative max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <FadeIn><SectionLabel number="03" className="mb-5">{t('subtitle')}</SectionLabel></FadeIn>
          <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent pb-1">{t('title')}</h2></FadeIn>
        </div>
        <FeaturesGrid items={items} />
      </div>
    </section>
  )
}
