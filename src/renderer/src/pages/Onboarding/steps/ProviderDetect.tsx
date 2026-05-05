import { useEffect, useState } from 'react'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { PROVIDER_IDS, PROVIDER_META, type ProviderId, type ProviderStatus } from '@shared/providers'
import { RefreshCw, Loader2 } from 'lucide-react'

export default function ProviderDetect() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const [status, setStatus] = useState<Record<ProviderId, ProviderStatus> | null>(null)
  const [loading, setLoading] = useState(true)

  async function detect(): Promise<void> {
    setLoading(true)
    const r = await window.api.invoke('providers:detect', undefined)
    setStatus(r)
    setLoading(false)
    const cur = draft.provider_default
    if (!cur || !r[cur].installed) {
      const firstInstalled = PROVIDER_IDS.find((id) => r[id].installed)
      if (firstInstalled) setDraft('provider_default', firstInstalled)
    }
  }

  useEffect(() => {
    void detect()
  }, [])

  const installedCount = status ? Object.values(status).filter((s) => s.installed).length : 0
  const canContinue = !!draft.provider_default && status?.[draft.provider_default].installed

  return (
    <Shell
      title="Qual IA você usa?"
      subtitle="Detectei as CLIs no seu PATH. Clique pra escolher o padrão."
      nextDisabled={!canContinue}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            {loading ? 'Procurando…' : `${installedCount} de ${PROVIDER_IDS.length} encontrados`}
          </span>
          <button
            onClick={() => void detect()}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Reescanear
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PROVIDER_IDS.map((id) => {
            const s = status?.[id]
            const installed = s?.installed ?? false
            const selected = draft.provider_default === id
            return (
              <button
                key={id}
                disabled={!installed}
                onClick={() => installed && setDraft('provider_default', id)}
                className={`provider-row ${selected ? 'provider-row-selected' : ''} ${!installed ? 'provider-row-disabled' : ''}`}
              >
                <span className="provider-label">{PROVIDER_META[id].label}</span>
                <span className={`provider-badge ${installed ? (selected ? 'provider-badge-selected' : 'provider-badge-ok') : 'provider-badge-missing'}`}>
                  {installed ? (selected ? '✓ padrão' : 'instalado') : 'não encontrado'}
                </span>
              </button>
            )
          })}
        </div>
        {!loading && installedCount === 0 && (
          <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 14, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Nenhuma CLI encontrada. Instale pelo menos uma e clique Reescanear.
          </div>
        )}
      </div>
    </Shell>
  )
}
