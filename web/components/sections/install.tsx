'use client'
import { useTranslations } from 'next-intl'
import { Download, ArrowUpRight } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { OsIcon, OS_ASSETS, type Os } from '@/components/icons/os-icon'

const REPO = 'https://github.com/Luccas-carvalho/DevSenses'
const ORDER: Os[] = ['macos', 'linux', 'windows']

export function Install() {
  const t = useTranslations('install')

  return (
    <section id="install" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <FadeIn>
            <SectionLabel number="07" className="mb-5">
              {t('subtitle')}
            </SectionLabel>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.05em] text-balance bg-gradient-to-br from-foreground to-foreground/55 bg-clip-text text-transparent pb-1">
              {t('title')}
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-muted-foreground">{t('sub')}</p>
          </FadeIn>
        </div>

        <FadeIn delay={0.3}>
          <div className="grid sm:grid-cols-3 gap-3">
            {ORDER.map((os) => (
              <a
                key={os}
                href={OS_ASSETS[os].url}
                className="group relative flex flex-col items-center gap-3 px-5 py-7 rounded-2xl border border-border bg-card/70 hover:border-primary/40 hover:bg-card/90 transition-colors overflow-hidden"
              >
                <div className="size-12 rounded-2xl border border-border bg-card flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-primary/40 transition-colors">
                  <OsIcon os={os} size={24} />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold text-base text-foreground">{t(`tabs.${os}`)}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    DevSenses{OS_ASSETS[os].ext}
                  </span>
                </div>
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">
                  <Download size={14} />
                  {t('download')}
                </span>
              </a>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>{t('not_ready_note')}</p>
            <a
              href={`${REPO}#build-from-source`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {t('build_from_source')}
              <ArrowUpRight size={12} />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
