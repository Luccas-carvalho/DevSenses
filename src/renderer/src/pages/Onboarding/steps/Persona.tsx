import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { PERSONAS, PERSONA_ORDER, type PersonaId, type PersonaIcon } from '@shared/personas'
import { Check, Compass, HeartHandshake, Zap, Flame, GraduationCap } from 'lucide-react'

const ICON_MAP: Record<PersonaIcon, typeof Compass> = {
  Compass,
  HeartHandshake,
  Zap,
  Flame,
  GraduationCap
}

const TINT: Record<PersonaId, string> = {
  default: 'rgba(167,139,250,0.95)',
  mentor: 'rgba(74,222,128,0.95)',
  pragmatic: 'rgba(252,211,77,0.95)',
  sarcastic: 'rgba(251,113,133,0.95)',
  academic: 'rgba(125,211,252,0.95)'
}

export default function Persona(): React.ReactElement {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const current: PersonaId = (draft.explanation_persona as PersonaId) ?? 'default'

  return (
    <Shell
      title="Qual o tom do tutor?"
      subtitle="A persona muda só o jeito de explicar — não o conteúdo. Pode trocar depois."
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
        {PERSONA_ORDER.map((id, i) => {
          const p = PERSONAS[id]
          const Icon = ICON_MAP[p.icon]
          const active = id === current
          return (
            <button
              key={id}
              onClick={() => setDraft('explanation_persona', id)}
              className="provider-row"
              style={{
                background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                borderColor: active ? TINT[id] : 'rgba(255,255,255,0.1)',
                animationDelay: `${0.1 + i * 0.06}s`,
                gap: 12
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `color-mix(in srgb, ${TINT[id]} 18%, transparent)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={16} style={{ color: TINT[id] }} />
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
                  {p.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.4
                  }}
                >
                  {p.short}
                </div>
              </div>
              {active && (
                <Check size={16} style={{ color: TINT[id], flexShrink: 0 }} strokeWidth={3} />
              )}
            </button>
          )
        })}
      </div>
    </Shell>
  )
}
