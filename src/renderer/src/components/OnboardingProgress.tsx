import { STEP_ORDER, type OnboardingStep } from '@/stores/onboarding'

export function OnboardingProgress({ current }: { current: OnboardingStep }) {
  const idx = STEP_ORDER.indexOf(current)
  const total = STEP_ORDER.length
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {idx + 1} / {total}
      </span>
    </div>
  )
}
