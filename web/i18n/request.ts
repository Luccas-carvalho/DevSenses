import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

const NAMESPACES = [
  'common',
  'hero',
  'pain',
  'solution',
  'features',
  'how-it-works',
  'providers',
  'pricing',
  'faq',
  'footer'
] as const

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../messages/${locale}/${ns}.json`)
      return [ns, mod.default] as const
    })
  )

  const messages = Object.fromEntries(entries)

  return { locale, messages }
})
