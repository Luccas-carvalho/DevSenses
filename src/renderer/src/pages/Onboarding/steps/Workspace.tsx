import { Shell } from '../Shell'
import { useOnboarding } from '@/stores/onboarding'
import { FolderOpen, Folder, X } from 'lucide-react'

export default function Workspace() {
  const draft = useOnboarding((s) => s.draft)
  const setDraft = useOnboarding((s) => s.setDraft)
  const path = draft.last_workspace ?? null

  async function pick(): Promise<void> {
    const r = await window.api.invoke('workspace:pickFolder', undefined)
    if (r) setDraft('last_workspace', r.path)
  }

  return (
    <Shell title="Tem um projeto pra começar?" subtitle="Aponta um repo pra eu ler diff e te explicar. Pode pular se quiser configurar depois." nextLabel={path ? 'Continuar' : 'Pular por agora'}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => void pick()}
          style={{
            width: '100%', padding: '32px 24px',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px dashed rgba(255,255,255,0.15)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        >
          <FolderOpen size={32} strokeWidth={1.25} style={{ color: 'rgba(167,139,250,0.8)' }} />
          <div style={{ fontWeight: 600, fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>Escolher pasta</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Aponta pra raiz de um repo git (com .git/ dentro)</div>
        </button>
        {path && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 14,
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
          }}>
            <Folder size={14} style={{ color: 'rgba(167,139,250,0.9)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'SF Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.65)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {path}
            </span>
            <button
              onClick={() => setDraft('last_workspace', null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
