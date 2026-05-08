import { Shell } from '../Shell'
import { Code2, Lightbulb, BookOpen } from 'lucide-react'
import Logo from '@/components/Logo'

const FEATURES = [
  { icon: Code2, title: 'Lê seu diff', desc: 'Quando tu (ou tua IA) editar arquivos, o DevSenses pega tudo que mudou.' },
  { icon: Lightbulb, title: 'Explica IA', desc: 'A IA quebra cada trecho, aponta conceitos, ajusta a profundidade pro teu nível.' },
  { icon: BookOpen, title: 'Fixa o aprendizado', desc: 'Comentários inline, glossário pessoal, histórico de explicações por branch.' },
]

export default function Welcome() {
  return (
    <Shell title="Bem-vindo ao DevSenses" subtitle="Tu deixou IA escrever. Deixa o DevSenses te ensinar o que ela fez." hidePrev nextLabel="Bora configurar">
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
