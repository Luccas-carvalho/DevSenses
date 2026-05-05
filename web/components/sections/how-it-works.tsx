import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
type Step = { number: string; title: string; description: string }
export async function HowItWorks() {
  const t = await getTranslations('how-it-works')
  const steps = t.raw('steps') as Step[]
  return (
    <section id="how-it-works" className="relative px-6 py-28 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <FadeIn><p className="text-sm font-mono text-primary uppercase tracking-widest mb-3">{t('subtitle')}</p></FadeIn>
          <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">{t('title')}</h2></FadeIn>
        </div>
        <div className="relative grid md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-8 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div className="flex flex-col items-center text-center">
                <div className="size-14 rounded-full border-2 border-primary bg-background text-primary font-mono font-bold flex items-center justify-center mb-5 z-10">
                  {s.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
