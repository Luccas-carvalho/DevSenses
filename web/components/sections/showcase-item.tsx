'use client'
import { motion } from 'framer-motion'
import { ThemeShowcase } from '@/components/theme-showcase'

type Item = { id: string; kicker: string; title: string; description: string; image: string; alt: string }

export function ShowcaseItem({ item, flipped }: { item: Item; flipped: boolean }) {
  return (
    <div
      className={`grid gap-10 lg:gap-16 items-center ${
        flipped ? 'lg:grid-cols-[1.6fr_1fr]' : 'lg:grid-cols-[1fr_1.6fr]'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, x: flipped ? 30 : -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col gap-4 ${flipped ? 'lg:order-2' : ''}`}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary/90">{item.kicker}</span>
        <h3 className="text-3xl md:text-4xl font-bold tracking-[-0.035em] text-balance bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          {item.title}
        </h3>
        <p className="text-base text-muted-foreground leading-relaxed text-balance max-w-md">
          {item.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`relative ${flipped ? 'lg:order-1' : ''}`}
      >
        {item.id === 'themes' ? (
          // Preview ao vivo dos temas (no lugar de um screenshot estático).
          <ThemeShowcase />
        ) : (
          // Fontes idênticas (2624×1824) + imagem sempre na coluna larga = mesmo tamanho.
          <div className="overflow-hidden rounded-xl">
            <img src={item.image} alt={item.alt} loading="lazy" className="block w-full h-auto" />
          </div>
        )}
      </motion.div>
    </div>
  )
}
