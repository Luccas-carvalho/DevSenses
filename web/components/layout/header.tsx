import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler'

export async function Header() {
  const t = await getTranslations('common.nav')
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/60 border-b border-border/40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="relative flex size-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.5)] group-hover:shadow-[0_0_24px_-2px_hsl(var(--primary)/0.6)] transition-shadow">
            <svg viewBox="0 0 16 16" className="size-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 4 L2 8 L5 12" />
              <path d="M11 4 L14 8 L11 12" />
              <path d="M9 3 L7 13" />
            </svg>
          </span>
          <span className="font-mono font-bold text-base tracking-tight">
            DevSenses
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {['features','how_it_works','install','faq'].map((k) => (
            <a key={k} href={`#${k.replace('_','-')}`} className="hover:text-foreground transition-colors">{t(k as any)}</a>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <AnimatedThemeToggler className="text-muted-foreground hover:text-foreground" />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
