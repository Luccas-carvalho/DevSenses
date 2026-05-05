import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { ThemeMode } from '@shared/settings'

const OPTIONS: { value: ThemeMode; icon: typeof Sun; label: string; desc: string }[] = [
  { value: 'auto', icon: Monitor, label: 'Sistema', desc: 'Segue o tema do seu SO.' },
  { value: 'dark', icon: Moon, label: 'Escuro', desc: 'Sempre escuro.' },
  { value: 'light', icon: Sun, label: 'Claro', desc: 'Sempre claro.' },
]

export default function Theme() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const { setTheme } = useTheme()

  return (
    <Shell title="Tema" subtitle="Pode trocar a qualquer momento depois.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400 }}>
        {OPTIONS.map(({ value, icon: Icon, label, desc }) => {
          const selected = draft.theme === value
          return (
            <button
              key={value}
              onClick={() => { setDraft('theme', value); setTheme(value) }}
              className={`step-card ${selected ? 'step-card-selected' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}
            >
              <Icon size={18} strokeWidth={1.5} style={{ color: 'rgba(167,139,250,0.9)', flexShrink: 0 }} />
              <div>
                <div className="step-card-title">{label}</div>
                <div className="step-card-desc">{desc}</div>
              </div>
            </button>
          )
        })}
      </div>
    </Shell>
  )
}
