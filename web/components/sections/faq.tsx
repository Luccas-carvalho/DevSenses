import { getTranslations } from 'next-intl/server'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FadeIn } from '@/components/animations/fade-in'
type Item = { q: string; a: string }
export async function Faq() {
  const t = await getTranslations('faq')
  const items = t.raw('items') as Item[]
  return (
    <section id="faq" className="relative px-6 py-28 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <FadeIn><p className="text-sm font-mono text-primary uppercase tracking-widest mb-3">{t('subtitle')}</p></FadeIn>
          <FadeIn delay={0.1}><h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">{t('title')}</h2></FadeIn>
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
