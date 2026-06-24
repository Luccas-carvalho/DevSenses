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

/**
 * Serializa um review em texto/markdown pronto pra colar em outra IA,
 * pedindo que ela avalie se os apontamentos fazem sentido e ajuste o que fizer.
 */
export function formatReviewAsPrompt(review: CodeReview): string {
  const out: string[] = []

  out.push(
    'Abaixo está um code review automático do meu código. Analise criticamente cada ' +
      'apontamento: diga quais fazem sentido e quais não, e para os que fizerem sentido, ' +
      'me mostre exatamente o que ajustar (com o código corrigido). Ignore o que for ' +
      'falso positivo e justifique brevemente.'
  )
  out.push('')
  out.push(`## Nota geral: ${review.grade.toFixed(1)}/10 (${gradeToLetter(review.grade)})`)

  if (review.summary) {
    out.push('')
    out.push(`**Resumo:** ${review.summary}`)
  }

  if (review.issues.length > 0) {
    out.push('')
    out.push(`## Problemas (${review.issues.length})`)
    const order: ReviewSeverity[] = ['critical', 'medium', 'low']
    const ordered = order.flatMap((sev) => review.issues.filter((i) => i.severity === sev))
    ordered.forEach((issue, i) => {
      const loc = issue.file ? ` — ${issue.file}${issue.line != null ? `:${issue.line}` : ''}` : ''
      out.push('')
      out.push(`### ${i + 1}. [${SEVERITY_LABEL[issue.severity]}] ${issue.title}${loc}`)
      out.push(issue.detail)
    })
  }

  if (review.strengths.length > 0) {
    out.push('')
    out.push('## Pontos fortes')
    review.strengths.forEach((s) => out.push(`- ${s}`))
  }

  if (review.suggestions.length > 0) {
    out.push('')
    out.push('## Sugestões de melhoria')
    review.suggestions.forEach((sug) => {
      out.push(`- ${sug.title}`)
      if (sug.example) {
        out.push('```')
        out.push(sug.example)
        out.push('```')
      }
    })
  }

  return out.join('\n')
}
