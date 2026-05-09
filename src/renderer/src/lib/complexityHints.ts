/**
 * Lightweight heuristic to flag potentially-expensive code blocks in a diff.
 * Detects nested loops, recursion, and quadratic patterns. NOT authoritative —
 * just a hint that triggers UI badge for the user to investigate.
 */

export interface ComplexityHint {
  pattern: 'nested-loop' | 'recursion' | 'forEach-includes' | 'array-find-in-loop'
  estimate: 'O(n²)' | 'O(2^n)' | 'O(n²) provável' | 'O(n²) provável'
  reason: string
}

const PATTERNS: Array<{
  re: RegExp
  hint: ComplexityHint
}> = [
  {
    // Nested for/for, for/while, etc. on same code block
    re: /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)/m,
    hint: {
      pattern: 'nested-loop',
      estimate: 'O(n²)',
      reason: 'Loop dentro de loop sobre mesmo (ou estrutura similar) — quadrático.'
    }
  },
  {
    // forEach + includes/find inside body — common N² pattern
    re: /\.forEach\s*\([^)]*\)\s*=>\s*[^}]*\.(includes|find|indexOf|some)\s*\(/m,
    hint: {
      pattern: 'forEach-includes',
      estimate: 'O(n²) provável',
      reason: '.forEach com .includes/.find dentro = busca linear por item, quadrático.'
    }
  },
  {
    // for + array.find / array.includes inside
    re: /for\s*\([^)]*\)[^}]*\.(includes|find|indexOf|some)\s*\(/m,
    hint: {
      pattern: 'array-find-in-loop',
      estimate: 'O(n²) provável',
      reason: 'Busca linear (find/includes/indexOf) dentro de loop = quadrático.'
    }
  }
]

/**
 * Detects if a function body recursively calls itself (heuristic: same name
 * appears inside its own body). Limited; misses anonymous recursion.
 */
function detectRecursion(snippet: string): ComplexityHint | null {
  const fnDecl = snippet.match(/function\s+(\w+)\s*\(/)
  const arrowConst = snippet.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/)
  const name = fnDecl?.[1] ?? arrowConst?.[1]
  if (!name) return null
  // Simple recursion: name appears as a call inside the snippet (excluding declaration)
  const callRe = new RegExp(`\\b${name}\\s*\\(`, 'g')
  const matches = snippet.match(callRe)
  if (!matches || matches.length < 2) return null
  return {
    pattern: 'recursion',
    estimate: 'O(2^n)',
    reason: `Função "${name}" se chama recursivamente — pode ser exponencial sem memoização.`
  }
}

export function detectComplexity(snippet: string): ComplexityHint[] {
  const hits: ComplexityHint[] = []
  for (const p of PATTERNS) {
    if (p.re.test(snippet)) hits.push(p.hint)
  }
  const rec = detectRecursion(snippet)
  if (rec) hits.push(rec)
  return hits
}
