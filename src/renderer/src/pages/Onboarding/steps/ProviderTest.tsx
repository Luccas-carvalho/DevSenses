import { useEffect, useState } from 'react'
import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { PROVIDER_META } from '@shared/providers'
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'

type Phase = 'idle' | 'running' | 'ok' | 'error'

export default function ProviderTest() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const id = draft.provider_default!
  const meta = PROVIDER_META[id]
  const [phase, setPhase] = useState<Phase>('idle')
  const [latency, setLatency] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function run(): Promise<void> {
    setPhase('running')
    setError(null)
    const r = await window.api.invoke('providers:test', { id })
    setLatency(r.latencyMs)
    if (r.ok) {
      setPhase('ok')
      const tested = { ...(draft.provider_tested ?? {}), [id]: true }
      setDraft('provider_tested', tested)
    } else {
      setPhase('error')
      setError(r.error ?? 'erro desconhecido')
    }
  }

  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <Shell
      title="Validando conexão"
      subtitle={`Mando "responda ok" pro ${meta.label} e confiro a resposta.`}
      nextDisabled={phase === 'running'}
    >
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="status-row">
          {phase === 'running' && <Loader2 size={28} className="animate-spin" style={{ color: 'rgba(167,139,250,1)', flexShrink: 0 }} />}
          {phase === 'ok' && <CheckCircle2 size={28} style={{ color: '#4ade80', flexShrink: 0 }} />}
          {phase === 'error' && <XCircle size={28} style={{ color: '#f87171', flexShrink: 0 }} />}
          {phase === 'idle' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <div className="status-label">{meta.label}</div>
            <div className="status-sub">
              {phase === 'running' && 'Aguardando resposta…'}
              {phase === 'ok' && `Funcionou em ${(latency / 1000).toFixed(1)}s`}
              {phase === 'error' && error}
            </div>
          </div>
          {phase !== 'running' && (
            <button
              onClick={() => void run()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <RefreshCw size={12} /> Tentar
            </button>
          )}
        </div>

        {phase === 'error' && (
          <div className="glass-terminal">
            <div className="err">Causas comuns:</div>
            <div className="output">· CLI precisa de login: <span className="cmd">{meta.binaryName} login</span></div>
            <div className="output">· Conta sem créditos / API key expirada</div>
            <div className="output">· Sem internet</div>
          </div>
        )}
      </div>
    </Shell>
  )
}
