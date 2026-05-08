export type PersonaId = 'default' | 'sarcastic' | 'pragmatic' | 'academic' | 'mentor'

/** Icon names from lucide-react. Resolved on the client. */
export type PersonaIcon =
  | 'Compass'
  | 'HeartHandshake'
  | 'Zap'
  | 'Flame'
  | 'GraduationCap'

export interface Persona {
  id: PersonaId
  label: string
  icon: PersonaIcon
  short: string
  prompt: string
}

export const PERSONAS: Record<PersonaId, Persona> = {
  default: {
    id: 'default',
    label: 'Padrão',
    icon: 'Compass',
    short: 'Tom neutro, claro e didático.',
    prompt: ''
  },
  sarcastic: {
    id: 'sarcastic',
    label: 'Sarcástico',
    icon: 'Flame',
    short: 'Provoca de leve, ensina sem ego.',
    prompt:
      'Tom: sarcástico mas educativo. Provoca o user de leve quando o código tem decisões questionáveis, sem zoeira gratuita ou desrespeito. Mantém o conteúdo técnico preciso.'
  },
  pragmatic: {
    id: 'pragmatic',
    label: 'Pragmático',
    icon: 'Zap',
    short: 'Direto, sem rodeio.',
    prompt:
      'Tom: direto ao ponto. Zero rodeio. Foca no que funciona na prática, não em teoria. Cita performance, casos reais, custo de manutenção.'
  },
  academic: {
    id: 'academic',
    label: 'Acadêmico',
    icon: 'GraduationCap',
    short: 'Rigoroso, cita padrões e teoria.',
    prompt:
      'Tom: rigoroso e formal. Cite paradigmas (functional/imperative/declarative), padrões de design clássicos (Gang of Four, refactoring catalog), complexity analysis quando relevante. Use terminologia precisa.'
  },
  mentor: {
    id: 'mentor',
    label: 'Mentor amigo',
    icon: 'HeartHandshake',
    short: 'Caloroso, encorajador.',
    prompt:
      'Tom: caloroso, encorajador. Trata erros como oportunidades de aprendizado, nunca julga. Use "tu" / "você" e analogias do dia-a-dia. Celebre boas decisões antes de apontar problemas.'
  }
}

export const PERSONA_ORDER: PersonaId[] = [
  'default',
  'mentor',
  'pragmatic',
  'sarcastic',
  'academic'
]
