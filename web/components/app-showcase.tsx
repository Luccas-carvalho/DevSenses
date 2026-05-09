'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Brain, Sparkles, ListChecks } from 'lucide-react'

export function AppShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 1], [10, 0, -4])
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.94, 1, 0.98])

  return (
    <div ref={ref} className="relative w-full max-w-[1100px] mx-auto" style={{ perspective: 1400 }}>
      <div aria-hidden className="absolute -inset-12 rounded-[40px] bg-primary/15 blur-[60px] pointer-events-none" />
      <div aria-hidden className="absolute -inset-2 rounded-[28px] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-2xl pointer-events-none" />

      <motion.div
        style={{ rotateX, scale, transformStyle: 'preserve-3d' }}
        className="relative rounded-2xl border border-border/60 bg-card/95 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.6),0_0_0_1px_hsl(var(--border)/0.5)] overflow-hidden backdrop-blur-xl"
      >
        {/* macOS chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
          <span className="size-3 rounded-full bg-destructive/70" />
          <span className="size-3 rounded-full bg-yellow-500/70" />
          <span className="size-3 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-[11px] font-mono text-muted-foreground">DevSenses · análise de diff</span>
          <span className="ml-auto text-[10px] font-mono text-primary uppercase tracking-widest flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary animate-flicker" />
            live
          </span>
        </div>

        {/* Body — diff + explanation */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Diff side */}
          <div className="relative bg-gradient-to-br from-muted/10 to-transparent">
            <div className="px-5 py-2 border-b border-border/40 flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">use-debounce.ts</span>
              <span className="ml-auto text-[10px] font-mono text-emerald-500/80">+5 −0</span>
            </div>
            <div className="font-mono text-[11.5px] leading-[1.85] py-3 overflow-hidden">
              <DiffLine kind="plain" n={1}>{'export function useDebounce<T>('}</DiffLine>
              <DiffLine kind="plain" n={2}>{'  value: T,'}</DiffLine>
              <DiffLine kind="plain" n={3}>{'  delay = 300'}</DiffLine>
              <DiffLine kind="plain" n={4}>{') {'}</DiffLine>
              <DiffLine kind="add" n={5}>{'  const [v, setV] = useState(value)'}</DiffLine>
              <DiffLine kind="add" n={6}>{'  useEffect(() => {'}</DiffLine>
              <DiffLine kind="add" n={7}>{'    const id = setTimeout(...)'}</DiffLine>
              <DiffLine kind="add" n={8}>{'    return () => clearTimeout(id)'}</DiffLine>
              <DiffLine kind="add" n={9}>{'  }, [value, delay])'}</DiffLine>
              <DiffLine kind="plain" n={10}>{'  return v'}</DiffLine>
              <DiffLine kind="plain" n={11}>{'}'}</DiffLine>
            </div>
          </div>

          {/* Explanation side */}
          <div className="relative bg-gradient-to-br from-primary/[0.05] via-card to-card">
            <div className="px-5 py-2 border-b border-border/40 flex items-center gap-2">
              <Brain size={12} className="text-primary" />
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest">explicação · profundidade 3</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-mono text-muted-foreground uppercase">
                <Sparkles size={10} className="text-primary/70" />
                <span>persona · mentor</span>
              </span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[13px] leading-relaxed text-foreground/90">
                <span className="font-semibold">useEffect com cleanup.</span> O <span className="font-mono text-primary">setTimeout</span> adia o update;
                <span className="font-mono text-primary"> clearTimeout</span> cancela se o <span className="font-mono text-primary">value</span> mudar antes do delay.
              </p>
              <p className="text-[13px] leading-relaxed text-foreground/85">
                Padrão clássico de <span className="font-mono text-primary underline decoration-dotted decoration-primary/50 underline-offset-2">debounce</span>.
                Útil em campo de busca pra evitar chamada por tecla.
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <Tag tone="primary" icon={<ListChecks size={11} />}>quiz disponível</Tag>
                <Tag tone="muted">3 conceitos</Tag>
                <Tag tone="muted">~12s de leitura</Tag>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="hidden md:flex absolute -top-4 left-1/2 -translate-x-1/2 items-center gap-2 px-3 py-1.5 rounded-full bg-card/95 border border-primary/40 backdrop-blur-md shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] text-[11px] font-mono"
      >
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-foreground">100% local · BYOK</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="hidden md:flex absolute -bottom-4 left-1/2 -translate-x-1/2 items-center gap-2 px-3 py-1.5 rounded-full bg-card/95 border border-primary/40 backdrop-blur-md shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] text-[11px] font-mono"
      >
        <kbd className="text-primary font-bold">⌘K</kbd>
        <span className="text-foreground">cheat sheet em qualquer trecho</span>
      </motion.div>
    </div>
  )
}

function DiffLine({ kind, n, children }: { kind: 'add' | 'del' | 'plain'; n: number; children: React.ReactNode }) {
  const cls = kind === 'add'
    ? 'bg-emerald-500/[0.08] border-l-2 border-emerald-500/60 text-emerald-300'
    : kind === 'del'
    ? 'bg-destructive/[0.08] border-l-2 border-destructive/60 text-destructive'
    : 'border-l-2 border-transparent text-foreground/80'
  return (
    <div className={`flex items-center gap-3 px-4 py-px ${cls} whitespace-nowrap`}>
      <span className="text-muted-foreground/50 w-5 text-right select-none shrink-0">{n}</span>
      <span className="shrink-0 select-none">{kind === 'add' ? '+' : kind === 'del' ? '−' : ' '}</span>
      <span className="truncate">{children}</span>
    </div>
  )
}

function Tag({ tone, icon, children }: { tone: 'primary' | 'muted'; icon?: React.ReactNode; children: React.ReactNode }) {
  const cls = tone === 'primary'
    ? 'bg-primary/12 border-primary/30 text-primary'
    : 'bg-muted/40 border-border text-muted-foreground'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${cls} text-[10px] font-mono uppercase tracking-widest`}>
      {icon}
      {children}
    </span>
  )
}
