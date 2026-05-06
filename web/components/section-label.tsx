import { cn } from '@/lib/utils'

export function SectionLabel({ number, children, className }: { number: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <span className="font-mono text-[11px] text-primary tabular-nums tracking-widest">{number}</span>
      <span className="h-px w-8 bg-gradient-to-r from-primary to-transparent" />
      <span className="font-mono text-[11px] text-primary uppercase tracking-[0.3em]">{children}</span>
    </div>
  )
}
