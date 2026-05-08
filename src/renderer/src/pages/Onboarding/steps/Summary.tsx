import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { SENIORITY_LABELS } from '@shared/seniority'
import { PROVIDER_META } from '@shared/providers'
import {
  User,
  GraduationCap,
  Bot,
  Palette,
  Folder,
  Check,
  Cpu,
  Sparkles,
  AlertCircle
} from 'lucide-react'

interface Props {
  onFinalize: () => Promise<void>
}

interface Row {
  icon: typeof User
  label: string
  value: string
  warn?: boolean
}

interface Group {
  title: string
  accent: string // tailwind color hint for the section ring
  rows: Row[]
}

export default function Summary({ onFinalize }: Props) {
  const draft = useOnboarding((s) => s.draft)

  const themeLabel =
    draft.theme === 'auto' ? 'Sistema' : draft.theme === 'dark' ? 'Escuro' : 'Claro'
  const seniority = draft.seniority
    ? `${SENIORITY_LABELS[draft.seniority]}${draft.seniority_source === 'quiz' ? ' (via quiz)' : ''}`
    : '—'
  const providerLabel = draft.provider_default
    ? PROVIDER_META[draft.provider_default].label
    : '—'

  const groups: Group[] = [
    {
      title: 'Você',
      accent: 'from-violet-500/30 to-fuchsia-500/10',
      rows: [
        { icon: User, label: 'Nome', value: draft.user_name || '—' },
        { icon: GraduationCap, label: 'Senioridade', value: seniority }
      ]
    },
    {
      title: 'Inteligência',
      accent: 'from-sky-500/30 to-violet-500/10',
      rows: [
        { icon: Bot, label: 'IA padrão', value: providerLabel },
        { icon: Cpu, label: 'Modelo', value: draft.provider_model || '—' }
      ]
    },
    {
      title: 'Ambiente',
      accent: 'from-emerald-500/30 to-sky-500/10',
      rows: [
        { icon: Palette, label: 'Tema', value: themeLabel },
        {
          icon: Folder,
          label: 'Workspace',
          value: draft.last_workspace ?? 'Não definido — pula por agora',
          warn: !draft.last_workspace
        }
      ]
    }
  ]

  let rowIdx = -1

  return (
    <Shell
      title="Tudo certo?"
      subtitle="Confere as escolhas — sempre dá pra mudar nas Settings."
      onNext={onFinalize}
      nextLabel="Concluir"
    >
      <div className="summary-stack">
        {groups.map((g, gi) => (
          <div
            key={g.title}
            className="summary-group"
            style={{ animationDelay: `${0.15 + gi * 0.08}s` }}
          >
            <div className={`summary-group-header bg-gradient-to-r ${g.accent}`}>
              <span>{g.title}</span>
            </div>
            <div className="summary-group-body">
              {g.rows.map((r) => {
                rowIdx++
                const Icon = r.icon
                return (
                  <div
                    key={r.label}
                    className="summary-row-v2"
                    style={{ animationDelay: `${0.25 + rowIdx * 0.06}s` }}
                  >
                    <div className="summary-row-icon">
                      <Icon size={14} />
                    </div>
                    <div className="summary-row-text">
                      <div className="summary-row-label">{r.label}</div>
                      <div
                        className={`summary-row-value ${r.warn ? 'summary-row-value-warn' : ''}`}
                        title={r.value}
                      >
                        {r.value}
                      </div>
                    </div>
                    {r.warn ? (
                      <AlertCircle size={14} className="summary-row-warn-icon" />
                    ) : (
                      <Check size={14} className="summary-row-check" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="summary-ready">
          <Sparkles size={14} className="summary-ready-icon" />
          <span>Tudo pronto pra começar a aprender com a IA.</span>
        </div>
      </div>
    </Shell>
  )
}
