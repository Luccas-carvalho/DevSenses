import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/theme-provider'
import { LenisProvider } from '@/components/lenis-provider'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })
  const title = locale === 'pt' ? 'DevSenses — Vire dev. Não operador.' : 'DevSenses — Become a dev. Not an operator.'
  return {
    title,
    description: t('sub'),
    metadataBase: new URL('https://devsenses.dev'),
    openGraph: { title, description: t('sub'), type: 'website' },
    twitter: { card: 'summary_large_image', title, description: t('sub') },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'en' | 'pt')) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <LenisProvider>{children}</LenisProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
