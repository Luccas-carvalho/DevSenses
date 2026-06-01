export type ReviewSeverity = 'critical' | 'medium' | 'low'

export interface ReviewIssue {
  severity: ReviewSeverity
  title: string
  file?: string
  line?: number
  detail: string
}

export interface ReviewSuggestion {
  title: string
  example?: string
}

export interface CodeReview {
  /** nota geral de 0 a 10 (uma casa decimal) */
  grade: number
  /** justificativa curta da nota (1-2 frases) */
  summary: string
  issues: ReviewIssue[]
  strengths: string[]
  suggestions: ReviewSuggestion[]
}

/** Converte a nota numérica (0-10) numa letra A+..F pra exibição. */
export function gradeToLetter(grade: number): string {
  if (grade >= 9.5) return 'A+'
  if (grade >= 9) return 'A'
  if (grade >= 8) return 'A-'
  if (grade >= 7) return 'B'
  if (grade >= 6) return 'C'
  if (grade >= 5) return 'D'
  return 'F'
}

export const SEVERITY_LABEL: Record<ReviewSeverity, string> = {
  critical: 'Crítico',
  medium: 'Médio',
  low: 'Baixo'
}
