'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Languages } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const t = useTranslations('common.language')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = (next: 'pt' | 'en') => {
    const stripped = pathname.replace(/^\/(pt|en)/, '') || '/'
    const target = next === 'pt' ? stripped : `/en${stripped}`
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`
    router.push(target)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={t('label')} className="p-2 rounded-md hover:bg-accent transition-colors">
        <Languages size={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchTo('pt')} className={cn(locale === 'pt' && 'text-primary font-medium')}>{t('pt')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchTo('en')} className={cn(locale === 'en' && 'text-primary font-medium')}>{t('en')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
