import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Hero } from '@/components/sections/hero'
import { Marquee } from '@/components/animations/marquee'
import { Pain } from '@/components/sections/pain'
import { Solution } from '@/components/sections/solution'
import { Showcase } from '@/components/sections/showcase'
import { Features } from '@/components/sections/features'
import { HowItWorks } from '@/components/sections/how-it-works'
import { Providers } from '@/components/sections/providers'
import { Pricing } from '@/components/sections/pricing'
import { Faq } from '@/components/sections/faq'
import { Footer } from '@/components/sections/footer'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee items={['Resumo', 'Detalhes', 'Conceitos', 'Quiz adaptativo', '⌘K Cheat Sheet', 'Modo Socrático', 'What if?', 'Caça ao bug', 'Big-O auto-detect', 'Detecção autoria IA', 'Glossário pessoal', '5 IAs · BYOK', '100% local']} />
        <Pain />
        <Solution />
        <Showcase />
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
