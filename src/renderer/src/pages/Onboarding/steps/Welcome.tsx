import { Shell } from '../Shell'
import { Code2, Lightbulb, Bug } from 'lucide-react'
import Logo from '@/components/Logo'

const FEATURES = [
  { icon: Code2, title: 'Diff inteligente', desc: 'A cada mudança do seu repo, o DevSenses lê o diff e te conta o que mudou.' },
  { icon: Lightbulb, title: 'Modo educação', desc: 'Explica os conceitos por trás (hooks, libs, patterns) no seu nível.' },
  { icon: Bug, title: 'Análise crítica', desc: 'Aponta bugs prováveis, problemas de segurança, anti-patterns.' },
]

export default function Welcome() {
  return (
    <Shell title="Bem-vindo ao DevSenses" subtitle="A IDE que ensina o que sua IA fez." hidePrev nextLabel="Vamos começar">
      <div style={{ marginBottom: 32, filter: 'drop-shadow(0 8px 32px rgba(139,92,246,0.5))' }}>
        <Logo size={96} style={{ borderRadius: 22 }} />
      </div>
      <div className="feature-list">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-item">
            <div className="feature-icon">
              <f.icon size={16} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="step-badge">
        <span>✦</span>
        <span>Configuração em 8 passos rápidos</span>
      </div>
    </Shell>
  )
}
