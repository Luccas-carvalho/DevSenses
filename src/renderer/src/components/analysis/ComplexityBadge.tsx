import { useState } from 'react'
import { Activity, AlertTriangle } from 'lucide-react'
import { detectComplexity, type ComplexityHint } from '@/lib/complexityHints'
import Tooltip from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

interface Props {
  snippet: string
  className?: string
}

const SEVERITY: Record<ComplexityHint['estimate'], 'warn' | 'high'> = {
  'O(n²)': 'warn',
  'O(n²) provável': 'warn',
  'O(2^n)': 'high'
}

export default function ComplexityBadge({ snippet, className }: Props): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  const hits = detectComplexity(snippet)
  if (hits.length === 0) return null

  const worst = hits[hits.length - 1]
  const severity = SEVERITY[worst.estimate] ?? 'warn'
  const Icon = severity === 'high' ? AlertTriangle : Activity

  return (
    <Tooltip
      label={`${worst.estimate} · clique pra ver detalhes`}
      side="top"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-mono font-bold rounded px-1.5 py-0.5 border transition-colors',
          severity === 'high'
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
            : 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25',
          className
        )}
      >
        <Icon className="size-2.5" />
        {worst.estimate}
        {open && (
          <ul className="absolute left-0 top-full mt-1 z-50 w-[280px] rounded-md border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl p-2 space-y-1.5 text-left">
            {hits.map((h, i) => (
              <li key={i} className="text-[11px] text-foreground/85 leading-snug">
                <span className="inline-block font-mono font-bold text-primary mr-1.5">
                  {h.estimate}
                </span>
                {h.reason}
              </li>
            ))}
          </ul>
        )}
      </button>
    </Tooltip>
  )
}
