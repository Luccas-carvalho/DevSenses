import { getTranslations } from 'next-intl/server'
import { ArrowRight, GitBranch } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { Aurora } from '@/components/animations/aurora'
import { MouseSpotlight } from '@/components/animations/mouse-spotlight'
import { WaitlistForm } from '@/components/waitlist-form'
import { HeroMockup } from '@/components/hero-mockup'

export async function Hero() {
  const t = await getTranslations('hero')
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden px-6 pt-24 pb-32">
      {/* Aurora glow */}
      <Aurora />

      {/* Grid texture */}
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_90%_70%_at_50%_30%,black_30%,transparent_90%)] pointer-events-none" />

      {/* Mouse spotlight */}
      <MouseSpotlight size={700} opacity={0.18} />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none z-[2]" />

      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Left: text */}
        <div className="flex flex-col gap-7 text-center lg:text-left items-center lg:items-start">
          <FadeIn>
            <div className="group inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-primary/25 bg-primary/[0.04] backdrop-blur-md text-xs font-mono shadow-[0_0_24px_-4px_hsl(var(--primary)/0.4)] hover:border-primary/50 transition-colors">
              <span className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                <span className="relative size-2 rounded-full bg-primary" />
              </span>
              <span className="text-primary uppercase tracking-widest">{t('tagline_top')}</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-[clamp(2.25rem,6.5vw,5rem)] font-bold tracking-[-0.04em] leading-[0.95] text-balance pb-2 bg-gradient-to-br from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
              {t('headline')}
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl text-balance leading-relaxed">{t('sub')}</p>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div className="flex flex-col items-center lg:items-start gap-5 mt-1">
              <WaitlistForm ctaLabel={t('cta_primary')} />
              <a href="https://github.com/Luccas-carvalho/devsenses" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <GitBranch size={15} className="group-hover:text-primary transition-colors" />
                {t('cta_secondary')}
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </FadeIn>
        </div>

        {/* Right: floating mockup */}
        <div className="relative">
          <HeroMockup />
        </div>
      </div>
    </section>
  )
}
