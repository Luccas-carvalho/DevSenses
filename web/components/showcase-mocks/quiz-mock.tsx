'use client'
import { Check, Brain } from 'lucide-react'

const CONCEPTS = [
  { name: 'useState', level: 3 },
  { name: 'useEffect cleanup', level: 2 },
  { name: 'closure', level: 1 },
  { name: 'event loop', level: 0 },
]

export function QuizMock() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-card grid grid-cols-[1.2fr_1fr] divide-x divide-border/50">
      <div className="relative px-5 py-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={12} className="text-primary" />
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">quiz adaptativo · 1 / 3</span>
        </div>
        <p className="text-[12.5px] font-medium text-foreground mb-3 leading-snug">
          Qual o motivo do <span className="font-mono text-primary">return () =&gt; clearTimeout(id)</span>?
        </p>
        <div className="space-y-2">
          <Choice label="Limpa o estado anterior do componente." correct={false} />
          <Choice label="Cancela o timer pendente quando value muda antes do delay." correct={true} />
          <Choice label="Força o useEffect a rodar de novo." correct={false} />
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase tracking-widest">
          <Check size={11} />
          +1 mastery em useEffect cleanup
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-primary/[0.05] to-card px-5 py-4">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">conceitos do diff</div>
        <ul className="space-y-2.5">
          {CONCEPTS.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-medium text-foreground/90 truncate">{c.name}</span>
              <span className="flex items-center gap-1 shrink-0">
                {[0, 1, 2, 3].map((dot) => (
                  <span
                    key={dot}
                    className={`size-2 rounded-full ${
                      dot <= c.level
                        ? dot === 3
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]'
                          : 'bg-primary'
                        : 'bg-muted/60'
                    }`}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 px-2 py-1.5 rounded-md border border-border bg-muted/30 text-[10px] font-mono text-muted-foreground leading-snug">
          5 acertos seguidos = <span className="text-emerald-400">Dominado</span> → some do quiz
        </div>
      </div>
    </div>
  )
}

function Choice({ label, correct }: { label: string; correct: boolean }) {
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-[11.5px] leading-snug ${
        correct
          ? 'border-emerald-500/50 bg-emerald-500/[0.08] text-foreground'
          : 'border-border bg-muted/20 text-foreground/75'
      }`}
    >
      <span
        className={`shrink-0 mt-0.5 size-3.5 rounded-full border ${
          correct ? 'border-emerald-500 bg-emerald-500/30' : 'border-border bg-transparent'
        } flex items-center justify-center`}
      >
        {correct && <Check size={9} className="text-emerald-400" />}
      </span>
      <span>{label}</span>
    </div>
  )
}
