import { getTranslations } from 'next-intl/server'
import { ArrowRight, Star } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { GalaxyBackdrop } from '@/components/animations/galaxy-backdrop'
import { MouseSpotlight } from '@/components/animations/mouse-spotlight'
import { AppShowcase } from '@/components/app-showcase'

export async function Hero() {
  const t = await getTranslations('hero')
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6 pt-28 pb-20">
      <GalaxyBackdrop density="dense" />

      <div className="absolute inset-0 bg-grid opacity-[0.18] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black_20%,transparent_85%)] pointer-events-none" />

      <MouseSpotlight size={650} opacity={0.14} />

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-[2]" />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-8">
        <FadeIn>
          <div className="group inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border border-primary/30 bg-primary/[0.06] backdrop-blur-md text-xs font-mono shadow-[0_0_28px_-4px_hsl(var(--primary)/0.5)] hover:border-primary/55 transition-colors">
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
              <span className="relative size-2 rounded-full bg-primary" />
            </span>
            <span className="text-primary uppercase tracking-widest">{t('tagline_top')}</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-bold tracking-[-0.045em] leading-[0.95] text-balance pb-2 max-w-4xl bg-gradient-to-br from-foreground via-foreground to-foreground/55 bg-clip-text text-transparent">
            {t('headline')}
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl text-balance leading-relaxed">
            {t('sub')}
          </p>
        </FadeIn>

        <FadeIn delay={0.32}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="https://github.com/Luccas-carvalho/devsenses"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-[0_0_36px_-6px_hsl(var(--primary)/0.7)] hover:shadow-[0_0_48px_-4px_hsl(var(--primary)/0.85)] transition-shadow"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden className="group-hover:rotate-[-6deg] transition-transform">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span>{t('cta_primary')}</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#showcase"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-card/60 backdrop-blur-md text-sm font-medium text-foreground/85 hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <Star size={14} className="text-primary" />
              <span>{t('cta_secondary')}</span>
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.48}>
          <div className="relative w-full mt-12 lg:mt-16">
            <AppShowcase />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
