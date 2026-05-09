'use client'
import { motion } from 'framer-motion'
import { OnboardingMock } from '@/components/showcase-mocks/onboarding-mock'
import { DiffMock } from '@/components/showcase-mocks/diff-mock'
import { QuizMock } from '@/components/showcase-mocks/quiz-mock'

type Item = { id: string; kicker: string; title: string; description: string; image: string; alt: string }

const MOCKS: Record<string, React.ComponentType> = {
  onboarding: OnboardingMock,
  diff: DiffMock,
  quiz: QuizMock,
}

export function ShowcaseItem({ item, flipped }: { item: Item; flipped: boolean }) {
  const Mock = MOCKS[item.id] ?? DiffMock
  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-center">
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
        <div aria-hidden className="absolute -inset-6 rounded-3xl bg-primary/12 blur-3xl pointer-events-none" />

        <div className="relative rounded-2xl border border-border/70 bg-card/95 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.55)] overflow-hidden backdrop-blur-xl">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="size-2.5 rounded-full bg-destructive/65" />
            <span className="size-2.5 rounded-full bg-yellow-500/65" />
            <span className="size-2.5 rounded-full bg-emerald-500/65" />
            <span className="ml-3 text-[11px] font-mono text-muted-foreground">DevSenses · {item.id}</span>
          </div>
          <Mock />
        </div>
      </motion.div>
    </div>
  )
}
