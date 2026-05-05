import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

export async function Header() {
  const t = await getTranslations('common.nav')
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-lg tracking-tight">
          <span className="text-primary">Dev</span>Senses
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {['features','how_it_works','pricing','faq'].map((k) => (
            <a key={k} href={`#${k.replace('_','-')}`} className="hover:text-foreground transition-colors">{t(k as any)}</a>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <AnimatedThemeToggler />
        </div>
      </div>
    </header>
  )
}
