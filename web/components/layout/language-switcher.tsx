'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Languages } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/cn'

export function LanguageSwitcher() {
  const t = useTranslations('common.language')
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = (locale: 'pt' | 'en') => {
    const stripped = pathname.replace(/^\/(pt|en)/, '') || '/'
    const target = locale === 'pt' ? stripped : `/en${stripped}`
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
    router.push(target)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('label')}
        className="p-2 rounded-md hover:bg-muted transition-colors"
      >
        <Languages size={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchTo('pt')}
          className={cn(currentLocale === 'pt' && 'text-primary font-medium')}
        >
          {t('pt')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchTo('en')}
          className={cn(currentLocale === 'en' && 'text-primary font-medium')}
        >
          {t('en')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
