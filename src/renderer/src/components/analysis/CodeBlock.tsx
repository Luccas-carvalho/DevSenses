import { Highlight } from 'prism-react-renderer'
import { useCodeTheme } from '@/hooks/useCodeTheme'
import { cn } from '@/lib/utils'

interface Props {
  code: string
  /** linguagem do Prism (default 'tsx') */
  language?: string
  className?: string
}

/**
 * Bloco de código com syntax highlight usando o mesmo tema do diff
 * (prism-react-renderer + tema escolhido em Aparência). Reusável em
 * qualquer lugar que mostre trechos de código multi-linha.
 */
export default function CodeBlock({
  code,
  language = 'tsx',
  className
}: Props): React.ReactElement {
  const { variant } = useCodeTheme()
  const prismTheme = variant.prism
  const bg = prismTheme.plain?.backgroundColor ?? 'var(--color-muted)'

  return (
    <Highlight code={code.replace(/\n+$/, '')} language={language} theme={prismTheme}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(
            'overflow-x-auto rounded-md border border-border/40 p-2.5 text-[11px] leading-relaxed font-mono whitespace-pre ds-scrollbar-x-thin',
            className
          )}
          style={{ background: bg }}
        >
          {tokens.map((line, i) => {
            const lineProps = getLineProps({ line })
            return (
              <div key={i} {...lineProps}>
                {line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}
              </div>
            )
          })}
        </pre>
      )}
    </Highlight>
  )
}
