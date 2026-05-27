import { Highlight, type PrismTheme } from 'prism-react-renderer'
import { useCodeTheme } from '@/hooks/useCodeTheme'

const PILL_TYPES = new Set([
  'function',
  'method',
  'class-name',
  'tag',
  'tag-name',
  'attr-name',
  'property',
  'property-access',
  'keyword',
  'control',
  'operator',
  'string',
  'attr-value',
  'number',
  'boolean',
  'variable',
  'parameter',
  'comment'
])

function pillClassFor(types: string[]): string {
  const matched = types.filter((t) => PILL_TYPES.has(t)).map((t) => `pl-${t}`)
  return matched.length > 0 ? `pl-token ${matched.join(' ')}` : ''
}

interface Props {
  code: string
  language?: string
  prismTheme?: PrismTheme
  className?: string
}

export default function HighlightedBlock({
  code,
  language = 'tsx',
  prismTheme,
  className
}: Props): React.JSX.Element {
  const { variant } = useCodeTheme()
  const theme = prismTheme ?? variant.prism

  return (
    <Highlight code={code} language={language} theme={theme}>
      {({ tokens, getTokenProps, style }) => (
        <pre
          className={
            className ??
            'bg-muted/40 border border-border/40 rounded-md px-2.5 py-1.5 overflow-x-auto font-mono text-[11px] leading-relaxed'
          }
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i}>
              {line.map((token, j) => {
                const props = getTokenProps({ token })
                const pill = pillClassFor(token.types ?? [])
                return (
                  <span
                    key={j}
                    {...props}
                    className={pill ? `${props.className ?? ''} ${pill}`.trim() : props.className}
                  />
                )
              })}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
