import { useNavigate } from 'react-router-dom'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { SENIORITY_LABELS } from '@shared/seniority'
import { PROVIDER_META } from '@shared/providers'
import { User, GraduationCap, Bot, Palette, Folder, Check, Cpu } from 'lucide-react'

export default function Summary() {
  const draft = useOnboarding((s) => s.draft)
  const reset = useOnboarding((s) => s.reset)
  const navigate = useNavigate()

  const items = [
    { icon: User, label: 'Nome', value: draft.user_name },
    { icon: GraduationCap, label: 'Senioridade', value: `${SENIORITY_LABELS[draft.seniority!]} ${draft.seniority_source === 'quiz' ? '(via quiz)' : ''}` },
    { icon: Bot, label: 'IA padrão', value: PROVIDER_META[draft.provider_default!].label },
    { icon: Cpu, label: 'Modelo', value: draft.provider_model },
    { icon: Palette, label: 'Tema', value: draft.theme === 'auto' ? 'Sistema' : draft.theme === 'dark' ? 'Escuro' : 'Claro' },
    { icon: Folder, label: 'Workspace', value: draft.last_workspace ?? '—' },
  ]

  async function finalize(): Promise<void> {
    await window.api.invoke('settings:set', { key: 'user_name', value: draft.user_name! })
    await window.api.invoke('settings:set', { key: 'seniority', value: draft.seniority! })
    await window.api.invoke('settings:set', { key: 'seniority_source', value: draft.seniority_source! })
    await window.api.invoke('settings:set', { key: 'provider_default', value: draft.provider_default! })
    await window.api.invoke('settings:set', { key: 'provider_model', value: draft.provider_model ?? '' })
    await window.api.invoke('settings:set', { key: 'provider_tested', value: draft.provider_tested ?? {} })
    await window.api.invoke('settings:set', { key: 'theme', value: draft.theme! })
    await window.api.invoke('settings:set', { key: 'last_workspace', value: draft.last_workspace ?? null })
    await window.api.invoke('settings:set', { key: 'onboarding_completed', value: true })
    reset()
    navigate('/home', { replace: true })
  }

  return (
    <Shell title="Tudo certo?" subtitle="Confere as escolhas — sempre dá pra mudar nas Settings." onNext={finalize} nextLabel="Concluir e abrir DevSenses">
      <div className="glass-container" style={{ textAlign: 'left' }}>
        {items.map((it) => (
          <div key={it.label} className="summary-row">
            <it.icon size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span className="summary-label">{it.label}</span>
            <span className="summary-value">{it.value || '—'}</span>
            <Check size={13} style={{ color: '#4ade80', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </Shell>
  )
}
