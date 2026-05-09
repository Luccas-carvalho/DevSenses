'use client'
import { Layers, MessagesSquare } from 'lucide-react'

const DEPTHS = ['Pra criança', 'Resumido', 'Equilibrado', 'Detalhado', 'Profundo']
const PERSONAS = ['Padrão', 'Mentor amigo', 'Pragmático', 'Sarcástico', 'Acadêmico']

export function OnboardingMock() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#0e0820] via-[#1a0f33] to-[#1e1040]">
      {/* Galaxy texture */}
      <div aria-hidden className="absolute inset-0 opacity-80">
        <div className="absolute top-1/4 left-1/3 size-64 rounded-full bg-primary/40 blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 size-48 rounded-full bg-fuchsia-500/30 blur-[70px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[420px] rounded-full border border-primary/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[260px] rounded-full border border-primary/40" />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-6 text-center">
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-widest mb-2">passo 6 / 11</span>
        <h4 className="text-xl md:text-2xl font-bold text-white mb-1.5 tracking-tight">Como você quer ouvir?</h4>
        <p className="text-xs md:text-sm text-white/65 max-w-md mb-5">Profundidade da explicação. Tu pode trocar a qualquer momento.</p>

        <div className="grid grid-cols-5 gap-1.5 w-full max-w-md mb-5">
          {DEPTHS.map((d, i) => (
            <div
              key={d}
              className={`px-2 py-2 rounded-md border text-[10px] font-medium tracking-tight ${
                i === 2
                  ? 'border-primary/70 bg-primary/20 text-primary shadow-[0_0_18px_-4px_hsl(var(--primary)/0.7)]'
                  : 'border-white/10 bg-white/[0.04] text-white/60'
              }`}
            >
              <Layers size={10} className="mx-auto mb-1 opacity-70" />
              {d}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md text-[10px] font-mono text-white/70">
          <MessagesSquare size={11} className="text-primary" />
          <span>persona · mentor amigo</span>
        </div>
      </div>
    </div>
  )
}
