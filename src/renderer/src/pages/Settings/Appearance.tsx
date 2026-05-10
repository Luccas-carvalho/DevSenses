import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Highlight } from 'prism-react-renderer'
import type { ThemeMode } from '@shared/settings'
import { CODE_THEMES, type CodeThemeId, type CodeThemePreset } from '@/lib/codeThemes'

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'auto', label: 'Auto', icon: Monitor }
]

const SAMPLE_CODE = `function greet(name: string): string {
  // saudação amigável
  const message = \`Olá, \${name}!\`
  return message.toUpperCase()
}`

const SAMPLE_DIFF: { type: 'ctx' | 'add' | 'del'; text: string }[] = [
  { type: 'ctx', text: 'function fetchUser(id: string) {' },
  { type: 'del', text: '  return db.query(`SELECT * FROM users WHERE id = ${id}`)' },
  { type: 'add', text: "  return db.query('SELECT * FROM users WHERE id = ?', [id])" },
  { type: 'ctx', text: '}' }
]

function readResolvedTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function ThemePreview({
  preset,
  variant,
  selected,
  onSelect
}: {
  preset: CodeThemePreset
  variant: 'light' | 'dark'
  selected: boolean
  onSelect: () => void
}): React.ReactElement {
  const v = variant === 'dark' ? preset.dark : preset.light
  const c = v.colors

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative text-left rounded-xl overflow-hidden transition-all',
        'border-2',
        selected
          ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10'
          : 'border-border/60 hover:border-border hover:shadow-md'
      )}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-10 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
          <Check className="size-3" strokeWidth={3} />
        </div>
      )}

      <div
        className="font-mono text-[10px] leading-[1.45] p-2.5"
        style={{ backgroundColor: c.bg, color: c.fg }}
      >
        <Highlight code={SAMPLE_CODE} language="tsx" theme={v.prism}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="m-0">
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span style={{ color: c.lineNum, marginRight: 8, userSelect: 'none' }}>
                    {String(i + 1).padStart(2, ' ')}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>

        <div
          className="mt-2 pt-2"
          style={{ borderTop: `1px solid ${c.border}` }}
        >
          {SAMPLE_DIFF.map((d, i) => {
            const bg = d.type === 'add' ? c.addBg : d.type === 'del' ? c.delBg : 'transparent'
            const sign = d.type === 'add' ? '+' : d.type === 'del' ? '-' : ' '
            const signColor = d.type === 'add' ? c.addFg : d.type === 'del' ? c.delFg : c.lineNum
            return (
              <div
                key={i}
                style={{ backgroundColor: bg, padding: '0 4px', display: 'flex' }}
              >
                <span style={{ color: signColor, width: 10, userSelect: 'none' }}>{sign}</span>
                <Highlight code={d.text} language="tsx" theme={v.prism}>
                  {({ tokens, getTokenProps }) => (
                    <span>
                      {tokens[0]?.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  )}
                </Highlight>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-3 py-2 bg-card border-t border-border/60 flex items-center justify-between">
        <span className="text-[12px] font-medium text-foreground">{preset.label}</span>
        <span className="text-[10px] text-muted-foreground">
          {preset.id === 'default' ? 'padrão' : 'preset'}
        </span>
      </div>
    </button>
  )
}

export default function Appearance(): React.ReactElement {
  const { value: themeMode, setValue: setThemeMode } = useSettings('theme')
  const { setTheme } = useTheme()
  const { value: codeTheme, setValue: setCodeTheme } = useSettings('code_theme')

  function applyMode(next: ThemeMode): void {
    setThemeMode(next)
    setTheme(next)
  }
  const [resolved, setResolved] = useState<'light' | 'dark'>(readResolvedTheme)

  useEffect(() => {
    const update = (): void => setResolved(readResolvedTheme())
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="w-full ds-fade-up">
      {/* Header row with mode selector */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-lg font-semibold">Aparência</h1>

        {/* Theme mode pill selector */}
        <div
          className="inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm p-0.5 shadow-sm"
          role="radiogroup"
          aria-label="Modo de tema"
        >
          {MODE_OPTIONS.map(({ value: opt, label, icon: Icon }) => (
            <button
              key={opt}
              type="button"
              onClick={() => applyMode(opt)}
              role="radio"
              aria-checked={themeMode === opt}
              className={cn(
                'inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] transition-all',
                themeMode === opt
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Code theme section */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Tema de código</h2>
            <p className="text-xs text-muted-foreground">
              Cores aplicadas ao diff e blocos de código. Preview adapta ao modo{' '}
              {resolved === 'dark' ? 'escuro' : 'claro'}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CODE_THEMES.map((preset) => (
            <ThemePreview
              key={preset.id}
              preset={preset}
              variant={resolved}
              selected={codeTheme === preset.id}
              onSelect={() => setCodeTheme(preset.id as CodeThemeId)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
