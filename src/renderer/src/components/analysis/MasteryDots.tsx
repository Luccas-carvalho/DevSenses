import { cn } from '@/lib/utils'

interface Props {
  level: number // 0-3
  size?: 'sm' | 'md'
}

const LABELS = ['Novato', 'Familiar', 'Proficiente', 'Dominado']
const TINTS = [
  'bg-muted-foreground/30',
  'bg-amber-400',
  'bg-sky-400',
  'bg-emerald-400'
]

export default function MasteryDots({ level, size = 'sm' }: Props): React.ReactElement {
  const clamped = Math.max(0, Math.min(3, level))
  const dotSize = size === 'sm' ? 'size-1.5' : 'size-2'
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`Domínio: ${LABELS[clamped]} (${clamped}/3)`}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            dotSize,
            'rounded-full transition-colors',
            i <= clamped ? TINTS[clamped] : 'bg-muted-foreground/15'
          )}
        />
      ))}
    </span>
  )
}
