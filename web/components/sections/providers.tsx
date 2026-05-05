import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
type Provider = { name: string; vendor: string }
export async function Providers() {
  const t = await getTranslations('providers')
  const providers = t.raw('providers') as Provider[]
  return (
    <section className="relative px-6 py-28 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <FadeIn><p className="text-sm font-mono text-primary uppercase tracking-widest mb-3">{t('subtitle')}</p></FadeIn>
          <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">{t('title')}</h2></FadeIn>
        </div>
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {providers.map((p) => (
              <div key={p.name} className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-center">
                <p className="font-mono font-bold">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.vendor}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
