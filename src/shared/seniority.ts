export type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior'

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  intern: 'Estagiário',
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior'
}

export const SENIORITY_DESCRIPTIONS: Record<SeniorityLevel, string> = {
  intern: 'Tô começando agora — explica o básico.',
  junior: 'Já programo, mas ainda aprendo conceitos novos toda semana.',
  mid: 'Sei o stack — só comenta decisões e edge cases.',
  senior: 'Manda só análise crítica — bugs, perf, security.'
}
