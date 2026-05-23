'use client'
import { useTranslations } from 'next-intl'
import { Star, GitFork, Users, Tag, ArrowUpRight } from 'lucide-react'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
import { NumberCounter } from '@/components/animations/number-counter'
import { useGitHubStats } from '@/lib/use-github-stats'

const REPO = 'https://github.com/Luccas-carvalho/DevSenses'

export function Stats() {
  const t = useTranslations('stats')
  const stats = useGitHubStats()

  const cards = [
    { key: 'stars', value: stats.stars, Icon: Star, href: `${REPO}/stargazers` },
    { key: 'forks', value: stats.forks, Icon: GitFork, href: `${REPO}/network/members` },
    { key: 'contributors', value: stats.contributors, Icon: Users, href: `${REPO}/graphs/contributors` },
    { key: 'releases', value: stats.releases, Icon: Tag, href: `${REPO}/releases` },
  ] as const

  return (
    <section id="stats" className="relative px-6 py-32 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <FadeIn>
            <SectionLabel number="08" className="mb-5">
              {t('subtitle')}
            </SectionLabel>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.05em] text-balance bg-gradient-to-br from-foreground to-foreground/55 bg-clip-text text-transparent pb-1">
              {t('title')}
            </h2>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(({ key, value, Icon: IconEl, href }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col gap-3 p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-md hover:border-primary/40 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <IconEl size={16} />
                </div>
                <NumberCounter
                  value={value}
                  className="text-3xl font-bold tracking-[-0.04em] text-foreground tabular-nums"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(`cards.${key}`)}</span>
                  <ArrowUpRight
                    size={14}
                    className="text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </a>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
