import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
type Step = { number: string; title: string; description: string }
export async function HowItWorks() {
  const t = await getTranslations('how-it-works')
  const steps = t.raw('steps') as Step[]
  return (
    <section id="how-it-works" className="relative px-6 py-28 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14">
          <FadeIn><SectionLabel number="04" className="mb-5">{t('subtitle')}</SectionLabel></FadeIn>
          <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent pb-1">{t('title')}</h2></FadeIn>
        </div>

        <div className="relative grid md:grid-cols-3 gap-5">
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-0" />
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div className="group relative h-full p-7 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors overflow-hidden">
                <span
                  aria-hidden
                  className="pointer-events-none select-none absolute -top-2 -right-1 font-mono font-black leading-none text-[7rem] text-primary/[0.07] group-hover:text-primary/10 transition-colors"
                >
                  {s.number}
                </span>
                <div className="relative">
                  <div className="inline-flex items-center gap-2.5 mb-5">
                    <span className="size-8 rounded-lg bg-primary/10 border border-primary/25 text-primary font-mono text-xs font-bold flex items-center justify-center shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]">
                      {s.number}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">step {s.number}</span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
