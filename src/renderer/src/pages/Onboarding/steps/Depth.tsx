import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { DEPTH_LABELS, DEPTH_DESCRIPTIONS } from '@/lib/diffPrompt'
import type { ExplanationDepth } from '@shared/settings'
import type { SeniorityLevel } from '@shared/seniority'
import { Layers, Check } from 'lucide-react'
import { useEffect } from 'react'

const DEPTHS: ExplanationDepth[] = [1, 2, 3, 4, 5]

const SENIORITY_DEFAULT_DEPTH: Record<SeniorityLevel, ExplanationDepth> = {
  intern: 2,
  junior: 3,
  mid: 3,
  senior: 4
}

const TINT: Record<ExplanationDepth, string> = {
  1: 'rgba(74,222,128,0.95)',
  2: 'rgba(125,211,252,0.95)',
  3: 'rgba(167,139,250,0.95)',
  4: 'rgba(252,211,77,0.95)',
  5: 'rgba(251,113,133,0.95)'
}

export default function Depth(): React.ReactElement {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const current: ExplanationDepth = (draft.explanation_depth as ExplanationDepth) ?? 3

  // Auto-suggest based on seniority on first visit
  useEffect(() => {
    if (draft.explanation_depth == null && draft.seniority) {
      const auto = SENIORITY_DEFAULT_DEPTH[draft.seniority as SeniorityLevel] ?? 3
      setDraft('explanation_depth', auto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Shell
      title="Quanto detalhe na explicação?"
      subtitle="Pode trocar a qualquer momento depois — esse é só o padrão inicial."
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        {DEPTHS.map((d) => {
          const active = d === current
          return (
            <button
              key={d}
              onClick={() => setDraft('explanation_depth', d)}
              className="provider-row"
              style={{
                background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                borderColor: active ? TINT[d] : 'rgba(255,255,255,0.1)',
                animationDelay: `${0.1 + d * 0.05}s`,
                gap: 12
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `color-mix(in srgb, ${TINT[d]} 18%, transparent)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Layers size={16} style={{ color: TINT[d] }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.95)',
                    marginBottom: 2
                  }}
                >
                  {DEPTH_LABELS[d]}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.4
                  }}
                >
                  {DEPTH_DESCRIPTIONS[d]}
                </div>
              </div>
              {active && (
                <Check
                  size={16}
                  style={{ color: TINT[d], flexShrink: 0 }}
                  strokeWidth={3}
                />
              )}
            </button>
          )
        })}
      </div>
    </Shell>
  )
}
