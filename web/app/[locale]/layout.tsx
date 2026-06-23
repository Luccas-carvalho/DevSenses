import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/components/theme-provider'
import { NoiseOverlay } from '@/components/animations/noise-overlay'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const BASE = 'https://devsenses.dev'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })

  const isPt = locale === 'pt'
  const title = isPt
    ? 'DevSenses — Vire dev. Não operador.'
    : 'DevSenses — Become a dev. Not an operator.'
  const description = t('sub')
  const url = isPt ? `${BASE}/pt` : `${BASE}/en`

  return {
    title,
    description,
    metadataBase: new URL(BASE),
    keywords: isPt
      ? ['DevSenses', 'aprender código', 'IA tutor', 'diff review', 'dev júnior', 'Cursor', 'Copilot', 'git diff', 'explicação de código', 'electron app']
      : ['DevSenses', 'learn to code', 'AI tutor', 'diff review', 'junior developer', 'Cursor', 'Copilot', 'git diff', 'code explanation', 'electron app'],
    authors: [{ name: 'Luccas Carvalho', url: 'https://github.com/Luccas-carvalho' }],
    creator: 'Luccas Carvalho',
    alternates: {
      canonical: url,
      languages: {
        'pt-BR': `${BASE}/pt`,
        'en': `${BASE}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'DevSenses',
      type: 'website',
      locale: isPt ? 'pt_BR' : 'en_US',
      alternateLocale: isPt ? 'en_US' : 'pt_BR',
      images: [
        {
          url: `${BASE}/og-image.png`,
          width: 1200,
          height: 630,
          alt: isPt ? 'DevSenses — Tutor IA local pro seu código' : 'DevSenses — Local AI tutor for your code',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@devsenses_app',
      creator: '@luccasdev',
      images: [`${BASE}/og-image.png`],
    },
    icons: {
      icon: [
        { url: '/icon.png', sizes: '1024x1024', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '1024x1024', type: 'image/png' },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
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
        <NoiseOverlay />
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
