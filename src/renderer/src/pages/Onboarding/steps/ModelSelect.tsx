import { useEffect } from 'react'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { PROVIDER_META } from '@shared/providers'
import { PROVIDER_MODELS, DEFAULT_MODEL } from '@/lib/providerModels'

export default function ModelSelect() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const providerId = draft.provider_default ?? 'claude'
  const models = PROVIDER_MODELS[providerId] ?? []
  const selected = draft.provider_model ?? ''

  // Auto-select default when provider changes or no model set
  useEffect(() => {
    if (!selected || !models.find((m) => m.id === selected)) {
      setDraft('provider_model', DEFAULT_MODEL[providerId] ?? models[0]?.id ?? '')
    }
  }, [providerId])

  const providerLabel = PROVIDER_META[providerId]?.label ?? providerId

  return (
    <Shell
      title="Qual modelo?"
      subtitle={`Escolha o modelo do ${providerLabel} para análise de diff.`}
      nextDisabled={!selected}
    >
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {models.map((m) => {
          const isSelected = selected === m.id
          return (
            <button
              key={m.id}
              onClick={() => setDraft('provider_model', m.id)}
              className={`provider-row ${isSelected ? 'provider-row-selected' : ''}`}
              style={{ textAlign: 'left' }}
            >
              <div>
                <span className="provider-label">{m.label}</span>
                {m.tag && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                    {m.tag}
                  </span>
                )}
              </div>
              {isSelected && (
                <span className="provider-badge provider-badge-selected">✓ selecionado</span>
              )}
            </button>
          )
        })}
      </div>
    </Shell>
  )
}
