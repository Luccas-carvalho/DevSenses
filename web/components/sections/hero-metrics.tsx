'use client'
import { useTranslations } from 'next-intl'
import { Star, Tag, BadgeCheck } from 'lucide-react'
import { useGitHubStats } from '@/lib/use-github-stats'
import { NumberCounter } from '@/components/animations/number-counter'

export function HeroMetrics() {
  const t = useTranslations('hero')
  const stats = useGitHubStats()

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/60 backdrop-blur-md">
        <Star size={12} className="text-primary" />
        <NumberCounter value={stats.stars} className="text-foreground" />
        <span>{t('metrics_label_stars')}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/60 backdrop-blur-md">
        <BadgeCheck size={12} className="text-primary" />
        <span>{t('metrics_label_license')}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/60 backdrop-blur-md">
        <Tag size={12} className="text-primary" />
        <span>v0.1.0 · {t('metrics_label_release')}</span>
      </span>
    </div>
  )
}
