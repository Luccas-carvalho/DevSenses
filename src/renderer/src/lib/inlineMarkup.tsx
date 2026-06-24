import React from 'react'

/**
 * Renderiza markup inline simples (`code` e **bold**) como elementos React.
 * Usado em explicações e no code review pra exibir trechos de código com
 * estilo, em vez de backticks crus. Quebra em palavras longas pra não estourar.
 */
export function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  const out: React.ReactNode[] = []
  parts.forEach((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push(
        <code
          key={`c-${i}`}
          className="bg-muted px-1 rounded text-[0.92em] font-mono text-primary/80 break-words"
        >
          {part.slice(1, -1)}
        </code>
      )
      return
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      out.push(
        <strong key={`b-${i}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
      return
    }
    if (part) out.push(<React.Fragment key={`t-${i}`}>{part}</React.Fragment>)
  })
  return out
}
