import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'

type Provider = { name: string; vendor: string }

export async function Providers() {
  const t = await getTranslations('providers')
  const providers = t.raw('providers') as Provider[]

  return (
    <section className="relative px-6 py-32 border-t border-border">
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

        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {providers.map((p) => (
              <div
                key={p.name}
                className="group relative p-6 rounded-xl border border-border bg-muted/20 hover:border-primary/40 transition-colors text-center"
              >
                <p className="font-mono font-bold text-lg">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.vendor}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
