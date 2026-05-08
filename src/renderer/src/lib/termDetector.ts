/**
 * Curated list of common JS/TS/React/Python/Web technical terms worth linking.
 * Conservative: false-positive over-linking is worse than missing.
 * Adicione aqui termos que aparecem com frequência nas explicações.
 */
export const TECHNICAL_TERMS: string[] = [
  // React core
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useRef',
  'useReducer',
  'useContext',
  'useLayoutEffect',
  'useImperativeHandle',
  'useTransition',
  'useDeferredValue',
  'createContext',
  'forwardRef',
  'memo',
  'Suspense',
  'StrictMode',
  'JSX',

  // React patterns
  'props drilling',
  'render props',
  'higher-order component',
  'controlled component',
  'uncontrolled component',
  'reconciliation',
  'virtual DOM',

  // JS/TS core
  'closure',
  'hoisting',
  'destructuring',
  'spread operator',
  'rest operator',
  'shallow copy',
  'deep copy',
  'event loop',
  'microtask',
  'macrotask',
  'Promise',
  'async/await',
  'generator',
  'iterator',
  'Symbol',
  'Proxy',
  'Reflect',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'this binding',
  'arrow function',
  'IIFE',
  'prototype',
  'prototype chain',
  'optional chaining',
  'nullish coalescing',
  'truthy',
  'falsy',
  'NaN',

  // TypeScript
  'generics',
  'union type',
  'intersection type',
  'discriminated union',
  'type guard',
  'type narrowing',
  'conditional type',
  'mapped type',
  'utility type',
  'Pick',
  'Omit',
  'Partial',
  'Required',
  'Readonly',
  'Record',
  'never',
  'unknown',
  'any',
  'asserts',
  'satisfies',

  // Async / network
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'CORS',
  'preflight',
  'CSRF',
  'CSP',
  'SameSite',

  // Performance / patterns
  'debounce',
  'throttle',
  'memoization',
  'lazy loading',
  'code splitting',
  'tree shaking',
  'tree-shaking',
  'optimistic update',
  'optimistic UI',
  'race condition',
  'deadlock',
  'idempotent',

  // Data structures / algos
  'big-O',
  'O(n)',
  'O(log n)',
  'O(n^2)',
  'binary search',
  'hash map',
  'linked list',
  'queue',
  'stack',
  'recursion',
  'tail call',
  'memoization',
  'dynamic programming',

  // Backend / API
  'REST',
  'GraphQL',
  'gRPC',
  'idempotency key',
  'rate limiting',
  'pagination',
  'cursor pagination',
  'offset pagination',
  'JWT',
  'OAuth',
  'OAuth 2.0',
  'OpenID Connect',
  'webhook',
  'long polling',
  'SSE',
  'server-sent events',

  // DB
  'transaction',
  'ACID',
  'isolation level',
  'index',
  'composite index',
  'foreign key',
  'normalization',
  'denormalization',
  'N+1',
  'N+1 query',
  'eager loading',
  'lazy loading',
  'connection pool',

  // Git
  'rebase',
  'merge commit',
  'fast-forward',
  'squash',
  'cherry-pick',
  'reflog',
  'detached HEAD',
  'force push',
  'fetch',
  'pull request',

  // Testing
  'unit test',
  'integration test',
  'e2e test',
  'test double',
  'mock',
  'stub',
  'spy',
  'fixture',
  'snapshot test',
  'TDD',
  'BDD',

  // Architecture
  'monolith',
  'microservice',
  'CQRS',
  'event sourcing',
  'pub/sub',
  'circuit breaker',
  'idempotent',
  'saga pattern',
  'feature flag',
  'A/B test'
]

interface DetectMatch {
  term: string
  start: number
  end: number
}

/**
 * Detects technical terms inside a text, returning non-overlapping matches.
 * Sorted by descending length first to prefer "race condition" over "race".
 */
export function detectTerms(text: string): DetectMatch[] {
  const sorted = [...TECHNICAL_TERMS].sort((a, b) => b.length - a.length)
  const claimed: Array<[number, number]> = []
  const matches: DetectMatch[] = []

  function overlaps(start: number, end: number): boolean {
    for (const [s, e] of claimed) {
      if (start < e && end > s) return true
    }
    return false
  }

  for (const term of sorted) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Word boundary works for ASCII; for terms with spaces we still rely on \b at edges
    const pattern = new RegExp(`\\b${escaped}\\b`, 'g')
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const start = m.index
      const end = start + m[0].length
      if (overlaps(start, end)) continue
      claimed.push([start, end])
      matches.push({ term: m[0], start, end })
    }
  }

  return matches.sort((a, b) => a.start - b.start)
}
