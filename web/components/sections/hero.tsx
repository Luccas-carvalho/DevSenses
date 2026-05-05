import { getTranslations } from 'next-intl/server'
import { ArrowRight, GitBranch } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { GradientBlob } from '@/components/animations/gradient-blob'
import { WaitlistForm } from '@/components/waitlist-form'

export async function Hero() {
  const t = await getTranslations('hero')
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-6 py-24">
      <GradientBlob className="w-[600px] h-[600px] -top-48 left-1/2 -translate-x-1/2" />
      <GradientBlob className="w-[400px] h-[400px] -bottom-32 -right-24 opacity-20" />
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/60 backdrop-blur-sm text-xs text-muted-foreground font-mono">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {t('tagline_top')}
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-balance">
            {t('headline')}
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-balance">{t('sub')}</p>
        </FadeIn>
        <FadeIn delay={0.35}>
          <div className="flex flex-col items-center gap-4">
            <WaitlistForm ctaLabel={t('cta_primary')} />
            <a href="https://github.com/Luccas-carvalho/DevSenses" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <GitBranch size={15} />{t('cta_secondary')}<ArrowRight size={13} />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
