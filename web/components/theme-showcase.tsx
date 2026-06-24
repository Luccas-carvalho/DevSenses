'use client'
import { useEffect, useState } from 'react'

/**
 * Preview ao vivo dos temas de syntax do app (cores reais de src/.../codeThemes.ts).
 * Ao escolher um tema, recolore o SITE INTEIRO — igual o app — sobrescrevendo as
 * CSS vars de design (--background/--foreground/--primary/...) no documentElement.
 * O chip "Padrão" remove os overrides e volta pra paleta roxa original do site.
 */

type Tok = 'plain' | 'comment' | 'keyword' | 'string' | 'fn' | 'number' | 'var' | 'punct'

interface Theme {
  id: string
  label: string
  /** true = restaura o tema padrão do site (remove os overrides). */
  reset?: boolean
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

// 1º "Default" = padrão do site (roxo, reseta os overrides). Demais = variante dark de codeThemes.ts.
const THEMES: Theme[] = [
  // Default: o CÓDIGO mostra o syntax real do app (vsDark). reset:true só reseta o
  // SITE pro padrão roxo (as cores abaixo pintam só o preview, não o site).
  {
    id: 'default',
    label: 'Default',
    reset: true,
    bg: '#1e1e1e',
    fg: '#d4d4d4',
    comment: '#6a9955',
    keyword: '#569cd6',
    string: '#ce9178',
    fn: '#dcdcaa',
    number: '#b5cea8',
    var: '#9cdcfe',
    punct: '#d4d4d4'
  },
  {
    id: 'dracula',
    label: 'Dracula',
    bg: '#282a36',
    fg: '#f8f8f2',
    comment: '#6272a4',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    fn: '#50fa7b',
    number: '#bd93f9',
    var: '#f8f8f2',
    punct: '#f8f8f2'
  },
  {
    id: 'monokai',
    label: 'Monokai',
    bg: '#272822',
    fg: '#f8f8f2',
    comment: '#75715e',
    keyword: '#f92672',
    string: '#e6db74',
    fn: '#a6e22e',
    number: '#ae81ff',
    var: '#fd971f',
    punct: '#f8f8f2'
  },
  {
    id: 'oneDark',
    label: 'One Dark',
    bg: '#282c34',
    fg: '#abb2bf',
    comment: '#5c6370',
    keyword: '#c678dd',
    string: '#98c379',
    fn: '#61afef',
    number: '#d19a66',
    var: '#e06c75',
    punct: '#abb2bf'
  },
  {
    id: 'tokyoNight',
    label: 'Tokyo Night',
    bg: '#1a1b26',
    fg: '#a9b1d6',
    comment: '#565f89',
    keyword: '#bb9af7',
    string: '#9ece6a',
    fn: '#7aa2f7',
    number: '#ff9e64',
    var: '#c0caf5',
    punct: '#a9b1d6'
  },
  {
    id: 'nord',
    label: 'Nord',
    bg: '#2e3440',
    fg: '#d8dee9',
    comment: '#616e88',
    keyword: '#81a1c1',
    string: '#a3be8c',
    fn: '#88c0d0',
    number: '#b48ead',
    var: '#d8dee9',
    punct: '#eceff4'
  },
  {
    id: 'github',
    label: 'GitHub',
    bg: '#0d1117',
    fg: '#c9d1d9',
    comment: '#8b949e',
    keyword: '#ff7b72',
    string: '#a5d6ff',
    fn: '#d2a8ff',
    number: '#79c0ff',
    var: '#ffa657',
    punct: '#c9d1d9'
  },
  {
    id: 'solarized',
    label: 'Solarized',
    bg: '#002b36',
    fg: '#839496',
    comment: '#586e75',
    keyword: '#859900',
    string: '#2aa198',
    fn: '#268bd2',
    number: '#d33682',
    var: '#cb4b16',
    punct: '#93a1a1'
  }
]

// CSS vars de design que o tema sobrescreve no site inteiro.
const SITE_VARS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring'
] as const

function hexToHslParts(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let hue = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) hue = (b - r) / d + 2
    else hue = (r - g) / d + 4
    hue /= 6
  }
  return [Math.round(hue * 360), Math.round(s * 100), Math.round(l * 100)]
}

/** Retorna "H S% L%" (formato esperado por hsl(var(--x))), com ajuste opcional de L. */
function hsl(hex: string, dl = 0): string {
  const [h, s, l] = hexToHslParts(hex)
  return `${h} ${s}% ${Math.max(0, Math.min(100, l + dl))}%`
}

function applySiteTheme(th: Theme): void {
  const root = document.documentElement.style
  const v: Record<string, string> = {
    '--background': hsl(th.bg),
    '--foreground': hsl(th.fg),
    '--card': hsl(th.bg, 3),
    '--card-foreground': hsl(th.fg),
    '--popover': hsl(th.bg, 4),
    '--popover-foreground': hsl(th.fg),
    '--primary': hsl(th.keyword),
    '--primary-foreground': hsl(th.bg),
    '--secondary': hsl(th.bg, 6),
    '--secondary-foreground': hsl(th.fg),
    '--muted': hsl(th.bg, 6),
    '--muted-foreground': hsl(th.comment),
    '--accent': hsl(th.bg, 9),
    '--accent-foreground': hsl(th.fg),
    '--border': hsl(th.bg, 12),
    '--input': hsl(th.bg, 12),
    '--ring': hsl(th.keyword)
  }
  for (const [k, val] of Object.entries(v)) root.setProperty(k, val)
}

function resetSiteTheme(): void {
  const root = document.documentElement.style
  for (const k of SITE_VARS) root.removeProperty(k)
}

const CODE: { t: string; k: Tok }[][] = [
  [{ t: '// quiz adaptativo: só o que tu ainda não domina', k: 'comment' }],
  [
    { t: 'const', k: 'keyword' },
    { t: ' ', k: 'plain' },
    { t: 'nivel', k: 'var' },
    { t: ' = ', k: 'punct' },
    { t: '"Dominado"', k: 'string' }
  ],
  [],
  [
    { t: 'function', k: 'keyword' },
    { t: ' ', k: 'plain' },
    { t: 'proximoQuiz', k: 'fn' },
    { t: '(', k: 'punct' },
    { t: 'conceitos', k: 'var' },
    { t: ') {', k: 'punct' }
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
    { t: ')', k: 'punct' }
  ],
  [
    { t: '  return', k: 'keyword' },
    { t: ' ', k: 'plain' },
    { t: 'escolher', k: 'fn' },
    { t: '(', k: 'punct' },
    { t: 'fracos', k: 'var' },
    { t: ', ', k: 'punct' },
    { t: '3', k: 'number' },
    { t: ')', k: 'punct' }
  ],
  [{ t: '}', k: 'punct' }]
]

export function ThemeShowcase() {
  const [active, setActive] = useState(0)
  const th = THEMES[active]

  // Ao escolher um tema, aplica no site inteiro (ou reseta no "Padrão").
  // Limpa o override ao desmontar pra não deixar o site preso num tema.
  useEffect(() => {
    if (th.reset) resetSiteTheme()
    else applySiteTheme(th)
    return () => resetSiteTheme()
  }, [active, th])

  return (
    <div className="w-full">
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
      <p className="mt-3 text-xs text-muted-foreground/70">
        Escolhe um tema — o site inteiro acompanha, igual no app.
      </p>
    </div>
  )
}
