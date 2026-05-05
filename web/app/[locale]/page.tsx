import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Hero } from '@/components/sections/hero'
import { Pain } from '@/components/sections/pain'
import { Solution } from '@/components/sections/solution'
import { Features } from '@/components/sections/features'
import { HowItWorks } from '@/components/sections/how-it-works'
import { Providers } from '@/components/sections/providers'
import { Pricing } from '@/components/sections/pricing'
import { Faq } from '@/components/sections/faq'
import { Footer } from '@/components/sections/footer'

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Pain />
        <Solution />
        <Features />
        <HowItWorks />
        <Providers />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
