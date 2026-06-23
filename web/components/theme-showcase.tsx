'use client'
import { useState } from 'react'

/**
 * Preview ao vivo dos temas de syntax do app (cores reais de src/.../codeThemes.ts).
 * Substitui o screenshot estático: o snippet recolore na hora ao trocar de tema.
 */

type Tok = 'plain' | 'comment' | 'keyword' | 'string' | 'fn' | 'number' | 'var' | 'punct'

interface Theme {
  id: string
  label: string
  bg: string
  fg: string
  comment: string
  keyword: string
  string: string
  fn: string
  number: string
  var: string
  punct: string
}

// 8 temas (variante dark) — extraídos de codeThemes.ts.
const THEMES: Theme[] = [
  { id: 'default', label: 'Default', bg: '#1e1e1e', fg: '#d4d4d4', comment: '#6a9955', keyword: '#569cd6', string: '#ce9178', fn: '#dcdcaa', number: '#b5cea8', var: '#9cdcfe', punct: '#d4d4d4' },
  { id: 'dracula', label: 'Dracula', bg: '#282a36', fg: '#f8f8f2', comment: '#6272a4', keyword: '#ff79c6', string: '#f1fa8c', fn: '#50fa7b', number: '#bd93f9', var: '#f8f8f2', punct: '#f8f8f2' },
  { id: 'monokai', label: 'Monokai', bg: '#272822', fg: '#f8f8f2', comment: '#75715e', keyword: '#f92672', string: '#e6db74', fn: '#a6e22e', number: '#ae81ff', var: '#fd971f', punct: '#f8f8f2' },
  { id: 'oneDark', label: 'One Dark', bg: '#282c34', fg: '#abb2bf', comment: '#5c6370', keyword: '#c678dd', string: '#98c379', fn: '#61afef', number: '#d19a66', var: '#e06c75', punct: '#abb2bf' },
  { id: 'tokyoNight', label: 'Tokyo Night', bg: '#1a1b26', fg: '#a9b1d6', comment: '#565f89', keyword: '#bb9af7', string: '#9ece6a', fn: '#7aa2f7', number: '#ff9e64', var: '#c0caf5', punct: '#a9b1d6' },
  { id: 'nord', label: 'Nord', bg: '#2e3440', fg: '#d8dee9', comment: '#616e88', keyword: '#81a1c1', string: '#a3be8c', fn: '#88c0d0', number: '#b48ead', var: '#d8dee9', punct: '#eceff4' },
  { id: 'github', label: 'GitHub', bg: '#0d1117', fg: '#c9d1d9', comment: '#8b949e', keyword: '#ff7b72', string: '#a5d6ff', fn: '#d2a8ff', number: '#79c0ff', var: '#ffa657', punct: '#c9d1d9' },
  { id: 'solarized', label: 'Solarized', bg: '#002b36', fg: '#839496', comment: '#586e75', keyword: '#859900', string: '#2aa198', fn: '#268bd2', number: '#d33682', var: '#cb4b16', punct: '#93a1a1' },
]

// Snippet hand-tokenizado (cobre comment/keyword/string/fn/number/var/punct).
const CODE: { t: string; k: Tok }[][] = [
  [{ t: '// quiz adaptativo: só o que tu ainda não domina', k: 'comment' }],
  [
    { t: 'const', k: 'keyword' },
    { t: ' ', k: 'plain' },
    { t: 'nivel', k: 'var' },
    { t: ' = ', k: 'punct' },
    { t: '"Dominado"', k: 'string' },
  ],
  [],
  [
    { t: 'function', k: 'keyword' },
    { t: ' ', k: 'plain' },
    { t: 'proximoQuiz', k: 'fn' },
    { t: '(', k: 'punct' },
    { t: 'conceitos', k: 'var' },
    { t: ') {', k: 'punct' },
  ],
  [
    { t: '  const', k: 'keyword' },
    { t: ' ', k: 'plain' },
    { t: 'fracos', k: 'var' },
    { t: ' = ', k: 'punct' },
    { t: 'conceitos', k: 'var' },
    { t: '.', k: 'punct' },
    { t: 'filter', k: 'fn' },
    { t: '(', k: 'punct' },
    { t: 'c', k: 'var' },
    { t: ' => ', k: 'punct' },
    { t: 'c', k: 'var' },
    { t: '.', k: 'punct' },
    { t: 'mastery', k: 'var' },
    { t: ' < ', k: 'punct' },
    { t: '4', k: 'number' },
    { t: ')', k: 'punct' },
  ],
  [
    { t: '  return', k: 'keyword' },
    { t: ' ', k: 'plain' },
    { t: 'escolher', k: 'fn' },
    { t: '(', k: 'punct' },
    { t: 'fracos', k: 'var' },
    { t: ', ', k: 'punct' },
    { t: '3', k: 'number' },
    { t: ')', k: 'punct' },
  ],
  [{ t: '}', k: 'punct' }],
]

export function ThemeShowcase() {
  const [active, setActive] = useState(0)
  const th = THEMES[active]

  return (
    <div className="w-full">
      {/* janela de editor recolorida pelo tema ativo */}
      <div
        className="overflow-hidden rounded-xl border border-white/10 shadow-2xl transition-colors duration-300"
        style={{ backgroundColor: th.bg }}
      >
        <div
          className="flex items-center gap-2 border-b px-4 py-2.5 transition-colors duration-300"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span
            className="ml-2 font-mono text-xs transition-colors duration-300"
            style={{ color: th.comment }}
          >
            quiz.ts · {th.label}
          </span>
        </div>
        <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
          <code>
            {CODE.map((line, i) => (
              <div key={i} style={{ minHeight: '1.4em' }}>
                {line.map((tok, j) => (
                  <span
                    key={j}
                    className="transition-colors duration-300"
                    style={{ color: tok.k === 'plain' ? th.fg : th[tok.k] }}
                  >
                    {tok.t}
                  </span>
                ))}
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* chips dos 8 temas */}
      <div className="mt-4 flex flex-wrap gap-2">
        {THEMES.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              i === active
                ? 'border-primary/50 bg-primary/10 text-foreground'
                : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: t.keyword }} />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
