import { getTranslations } from 'next-intl/server'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { ProviderIcon } from '@/components/provider-icon'
type Provider = { name: string; vendor: string }
export async function Providers() {
  const t = await getTranslations('providers')
  const providers = t.raw('providers') as Provider[]
  return (
    <section className="relative px-6 py-28 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <FadeIn><SectionLabel number="05" className="mb-5">{t('subtitle')}</SectionLabel></FadeIn>
          <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent pb-1">{t('title')}</h2></FadeIn>
        </div>
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {providers.map((p) => (
              <div key={p.name} className="group relative p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="size-10 mx-auto mb-3 rounded-lg bg-foreground/[0.04] border border-border flex items-center justify-center text-foreground/85">
                    <ProviderIcon name={p.name} className="size-5" />
                  </div>
                  <p className="font-mono font-bold text-sm">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider">{p.vendor}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
