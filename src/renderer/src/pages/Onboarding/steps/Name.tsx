import { useOnboarding } from '@/stores/onboarding'
import { Shell } from '../Shell'

export default function Name() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const value = draft.user_name ?? ''

  return (
    <Shell
      title="Como devemos te chamar?"
      subtitle="Aparece no app pra deixar a vibe pessoal."
      nextDisabled={value.trim().length < 2}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <input
          className="glass-input"
          value={value}
          onChange={(e) => setDraft('user_name', e.target.value)}
          placeholder="Ex.: Luccas"
          autoFocus
          maxLength={40}
        />
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 10, textAlign: 'center' }}>
          Pode ser primeiro nome, apelido — o que preferir.
        </p>
      </div>
    </Shell>
  )
}
