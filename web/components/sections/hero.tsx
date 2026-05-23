import { getTranslations } from 'next-intl/server'
import { Star } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { HeroAurora } from '@/components/animations/hero-aurora'
import { AppShowcase } from '@/components/app-showcase'
import { HeroDownloadButton } from '@/components/sections/hero-download-button'

const REPO_URL = 'https://github.com/Luccas-carvalho/DevSenses'

export async function Hero() {
  const t = await getTranslations('hero')
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center overflow-hidden px-6 pt-40 pb-32 text-center"
    >
      {/* WebGL aurora shader (Cadence-style, mouse-warped) */}
      <HeroAurora />

      {/* Ambient glow orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Shooting stars */}
      <div className="hero-stars">
        <div className="hero-star hero-star-1" />
        <div className="hero-star hero-star-2" />
        <div className="hero-star hero-star-3" />
        <div className="hero-star hero-star-4" />
        <div className="hero-star hero-star-5" />
        <div className="hero-star hero-star-6" />
      </div>

      {/* Orbit rings with rotating dots */}
      <div className="hero-orbits">
        <div className="hero-orbit hero-orbit-1">
          <div className="hero-orbit-dot" />
        </div>
        <div className="hero-orbit hero-orbit-2">
          <div className="hero-orbit-dot" />
        </div>
        <div className="hero-orbit hero-orbit-3">
          <div className="hero-orbit-dot" />
        </div>
      </div>

      {/* Top + bottom mask gradients */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background/40 to-transparent pointer-events-none z-[3]" />
      <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-[3]" />

      {/* Content */}
      <div className="relative z-[4] w-full max-w-3xl mx-auto flex flex-col items-center gap-6">
        <FadeIn>
          <div className="inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-primary/30 bg-primary/[0.06] backdrop-blur-md text-xs font-mono shadow-[0_0_28px_-4px_hsl(var(--primary)/0.5)]">
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
              <span className="relative size-2 rounded-full bg-primary" />
            </span>
            <span className="text-primary uppercase tracking-widest">{t('tagline_top')}</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-light tracking-[-0.03em] leading-[1.05] text-balance text-foreground max-w-3xl">
            {t('headline')}
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl text-balance leading-relaxed">
            {t('sub')}
          </p>
        </FadeIn>

        <FadeIn delay={0.32}>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero-primary"
            >
              <Star size={15} className="fill-current" />
              <span>{t('cta_primary')}</span>
            </a>
            <HeroDownloadButton />
          </div>
        </FadeIn>

        <div className="relative w-full mt-16 lg:mt-24">
          <AppShowcase />
        </div>
      </div>
    </section>
  )
}
