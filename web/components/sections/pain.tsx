import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { PainList } from './pain-list'
export async function Pain() {
  const t = await getTranslations('pain')
  const bullets = t.raw('bullets') as string[]
  return (
    <section className="relative px-6 py-28 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      <div className="relative max-w-4xl mx-auto">
        <FadeIn><SectionLabel number="01" className="mb-5">{t('subtitle')}</SectionLabel></FadeIn>
        <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent pb-1">{t('title')}</h2></FadeIn>
        <PainList items={bullets} />
      </div>
    </section>
  )
}
