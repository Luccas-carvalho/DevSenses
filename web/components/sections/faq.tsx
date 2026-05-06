import { getTranslations } from 'next-intl/server'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FadeIn } from '@/components/animations/fade-in'
import { SectionLabel } from '@/components/section-label'
type Item = { q: string; a: string }
export async function Faq() {
  const t = await getTranslations('faq')
  const items = t.raw('items') as Item[]
  return (
    <section id="faq" className="relative px-6 py-28 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <FadeIn><SectionLabel number="07" className="mb-5">{t('subtitle')}</SectionLabel></FadeIn>
          <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent pb-1">{t('title')}</h2></FadeIn>
        </div>
        <FadeIn delay={0.2}>
          <Accordion type="single" collapsible>
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  )
}
