import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'

type Step = { number: string; title: string; description: string }

export async function HowItWorks() {
  const t = await getTranslations('how-it-works')
  const steps = t.raw('steps') as Step[]

  return (
    <section id="how-it-works" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">
              {t('subtitle')}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6">
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />
          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center size-12 rounded-full border border-primary bg-background text-primary font-mono font-bold mb-6 relative z-10">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
