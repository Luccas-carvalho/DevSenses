import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { ShowcaseItem } from './showcase-item'

type Item = { id: string; kicker: string; title: string; description: string; image: string; alt: string }

export async function Showcase() {
  const t = await getTranslations('showcase')
  const items = t.raw('items') as Item[]
  return (
    <section id="showcase" className="relative px-6 py-32 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.12] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-20">
          <FadeIn><SectionLabel number="03" className="mb-5">{t('subtitle')}</SectionLabel></FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.035em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent pb-1">
              {t('title')}
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed text-balance">
              {t('description')}
            </p>
          </FadeIn>
        </div>

        <div className="flex flex-col gap-28">
          {items.map((item, i) => (
            <ShowcaseItem key={item.id} item={item} flipped={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
