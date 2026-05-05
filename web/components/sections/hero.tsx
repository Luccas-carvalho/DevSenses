import { getTranslations } from 'next-intl/server'
import { ArrowRight, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/animations/fade-in'
import { GradientBlob } from '@/components/animations/gradient-blob'
import { WaitlistForm } from '@/components/waitlist-form'

export async function Hero() {
  const t = await getTranslations('hero')

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-6 py-24">
      <GradientBlob className="w-[700px] h-[700px] top-[-200px] left-1/2 -translate-x-1/2" />
      <GradientBlob className="w-[500px] h-[500px] bottom-[-150px] right-[-100px] opacity-25" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeIn delay={0}>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-border bg-background/60 backdrop-blur-sm text-xs text-muted-foreground font-mono">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            {t('tagline_top')}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-balance">
            {t('headline')}
          </h1>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            {t('sub')}
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-10 flex flex-col items-center gap-4">
            <WaitlistForm ctaLabel={t('cta_primary')} />
            <a
              href={process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/Luccas-carvalho/DevSenses'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github size={16} />
              {t('cta_secondary')}
              <ArrowRight size={14} />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
