import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { AnimatedDiffDemo } from '@/components/animated-diff-demo'

export async function Solution() {
  const t = await getTranslations('solution')
  const explanation = t.raw('demo_explanation') as string[]
  const diff = t.raw('demo_diff') as string
  const painBullets = t.raw('pain_bullets') as string[]
  return (
    <section className="relative px-6 py-28 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] pointer-events-none" />
      <div className="relative max-w-5xl mx-auto">
        <FadeIn>
          <div className="max-w-2xl mx-auto mb-12 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/70 mb-4">
              {t('pain_eyebrow')}
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground/80">
              {painBullets.map((b) => (
                <li key={b} className="px-3 py-2 rounded-md border border-border/60 bg-card/40">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
        <div className="text-center mb-14 flex flex-col items-center">
          <FadeIn><SectionLabel number="02" className="mb-5">solução</SectionLabel></FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.05em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent pb-1">{t('title')}</h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">{t('sub')}</p>
          </FadeIn>
        </div>
        <FadeIn delay={0.3}>
          <AnimatedDiffDemo diff={diff} explanation={explanation} label={t('demo_label')} />
        </FadeIn>
      </div>
    </section>
  )
}
