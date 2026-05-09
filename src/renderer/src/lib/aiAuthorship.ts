/**
 * Heuristic to estimate likelihood that a diff was AI-written.
 * Returns score 0-100 + signals breakdown. Not authoritative — informational.
 */

export interface AuthorshipSignal {
  label: string
  weight: number // points contributed
  detail: string
}

export interface AuthorshipResult {
  score: number // 0-100
  verdict: 'human' | 'mixed' | 'ai-likely' | 'ai-very-likely'
  signals: AuthorshipSignal[]
}

/**
 * Counts only added lines from a unified diff string.
 */
function extractAddedLines(diff: string): string[] {
  const lines: string[] = []
  for (const ln of diff.split('\n')) {
    if (ln.startsWith('+++') || ln.startsWith('---')) continue
    if (ln.startsWith('+')) lines.push(ln.slice(1))
  }
  return lines
}

export function detectAIAuthorship(diff: string): AuthorshipResult {
  const added = extractAddedLines(diff)
  const totalLines = added.length
  const signals: AuthorshipSignal[] = []
  let score = 0

  if (totalLines === 0) {
    return { score: 0, verdict: 'human', signals: [] }
  }

  const addedText = added.join('\n')

  // 1. Comment density (verbose comments = LLM tendency)
  const commentLines = added.filter((l) =>
    /^\s*(\/\/|#|\/\*|\*|<!--)/.test(l)
  ).length
  const commentRatio = commentLines / totalLines
  if (commentRatio > 0.25 && totalLines > 8) {
    const pts = Math.min(20, Math.round(commentRatio * 60))
    score += pts
    signals.push({
      label: 'Densidade alta de comentários',
      weight: pts,
      detail: `${Math.round(commentRatio * 100)}% das linhas adicionadas são comentários — LLMs tendem a comentar mais que humanos.`
    })
  }

  // 2. Docstring / JSDoc patterns
  const jsdocBlocks = (addedText.match(/\/\*\*[\s\S]*?\*\//g) ?? []).length
  if (jsdocBlocks >= 2) {
    const pts = Math.min(15, jsdocBlocks * 5)
    score += pts
    signals.push({
      label: 'Múltiplos blocos JSDoc/docstring',
      weight: pts,
      detail: `${jsdocBlocks} blocos de documentação formal detectados.`
    })
  }

  // 3. Verbose variable names (snake_case_super_long_names ou camelCaseExtremamenteVerbosoQueParece)
  const longNames = added.flatMap((l) =>
    Array.from(l.matchAll(/\b[a-z][a-zA-Z0-9_]{20,}\b/g)).map((m) => m[0])
  )
  if (longNames.length >= 3) {
    const pts = Math.min(10, longNames.length * 2)
    score += pts
    signals.push({
      label: 'Variáveis com nomes muito longos',
      weight: pts,
      detail: `${longNames.length} identifiers com 20+ caracteres — padrão típico de LLM.`
    })
  }

  // 4. Excessive try-catch wrapping
  const tryCount = (addedText.match(/\btry\s*\{/g) ?? []).length
  const fnCount = (addedText.match(/\b(function|=>)/g) ?? []).length
  if (fnCount > 0 && tryCount / fnCount >= 0.5 && tryCount >= 2) {
    score += 10
    signals.push({
      label: 'Try-catch em quase toda função',
      weight: 10,
      detail: `${tryCount} try/catch em ${fnCount} funções — defensiveness exagerada típica de LLM.`
    })
  }

  // 5. AI-typical phrases in comments
  const phraseRegex =
    /\b(let me|i'll|i will|I would|here is|here's|in this code|the following|this function|this code does|implements? a)\b/gi
  const phraseHits = (addedText.match(phraseRegex) ?? []).length
  if (phraseHits >= 2) {
    const pts = Math.min(15, phraseHits * 4)
    score += pts
    signals.push({
      label: 'Frases típicas de IA em comentários',
      weight: pts,
      detail: `${phraseHits} ocorrência(s) de frases como "let me", "here is", "this function..." comuns em saída de LLM.`
    })
  }

  // 6. Massive single-commit size
  if (totalLines >= 200) {
    score += 12
    signals.push({
      label: 'Diff muito grande',
      weight: 12,
      detail: `${totalLines}+ linhas adicionadas — humanos costumam fragmentar mudanças.`
    })
  } else if (totalLines >= 100) {
    score += 6
    signals.push({
      label: 'Diff acima da média',
      weight: 6,
      detail: `${totalLines} linhas adicionadas — possível geração em batch.`
    })
  }

  // 7. Type annotations on every variable (TS)
  const typedDeclarations = (addedText.match(/\b(const|let|var)\s+\w+:\s*\w+/g) ?? []).length
  const allDeclarations = (addedText.match(/\b(const|let|var)\s+\w+/g) ?? []).length
  if (allDeclarations >= 6 && typedDeclarations / allDeclarations > 0.8) {
    score += 8
    signals.push({
      label: 'Anotações de tipo em quase toda declaração',
      weight: 8,
      detail: 'Mesmo onde inferência seria suficiente — tendência de LLMs.'
    })
  }

  // 8. Overly explicit return types
  const returnTypeAnno = (addedText.match(/\):\s*(void|string|number|boolean|Promise<)/g) ?? []).length
  if (returnTypeAnno >= 5) {
    score += 6
    signals.push({
      label: 'Tipos de retorno explícitos em massa',
      weight: 6,
      detail: `${returnTypeAnno} funções com tipo de retorno explícito.`
    })
  }

  // Cap & verdict
  score = Math.min(100, score)
  let verdict: AuthorshipResult['verdict'] = 'human'
  if (score >= 60) verdict = 'ai-very-likely'
  else if (score >= 35) verdict = 'ai-likely'
  else if (score >= 18) verdict = 'mixed'

  return { score, verdict, signals }
}
