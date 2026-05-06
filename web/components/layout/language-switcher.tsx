'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Check, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const LOCALES = [
  { code: 'pt', label: 'pt-BR', name: 'Português' },
  { code: 'en', label: 'en-US', name: 'English' },
] as const

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  const switchTo = (next: 'pt' | 'en') => {
    if (next === locale) return
    const stripped = pathname.replace(/^\/(pt|en)/, '') || '/'
    const target = next === 'pt' ? stripped : `/en${stripped}`
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`
    router.push(target)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Idioma"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-background/40 backdrop-blur-sm text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/[0.04] transition-colors data-[state=open]:border-primary/40 data-[state=open]:text-foreground"
      >
        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
        {current.label}
        <ChevronDown size={12} className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[160px] font-mono">
        {LOCALES.map((l) => {
          const active = locale === l.code
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => switchTo(l.code)}
              className={cn(
                'flex items-center justify-between gap-3 cursor-pointer text-xs',
                active && 'text-primary'
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{l.label}</span>
                <span className="text-[10px] text-muted-foreground font-sans">{l.name}</span>
              </div>
              {active && <Check size={13} className="text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
