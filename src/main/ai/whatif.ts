import { PROVIDERS } from '../providers/registry'
import type { ProviderId } from '@shared/providers'

interface Args {
  diff: string
  alternative: string
  seniority: string
  providerId: ProviderId
}

const PROMPT = (args: Args): string => `
Você é um tutor experiente. O dev (nível "${args.seniority}") está estudando este diff e quer comparar com uma abordagem alternativa.

DIFF ATUAL:
\`\`\`diff
${args.diff.slice(0, 6000)}
\`\`\`

ABORDAGEM ALTERNATIVA QUE O USER QUER COMPARAR:
"""
${args.alternative.slice(0, 500)}
"""

Tarefa: gere comparação técnica em markdown com EXATAMENTE essa estrutura:

### Resumo da comparação
2-3 frases. Diga qual abordagem você recomenda no contexto E por quê (ou se ambas servem).

### O que mudaria
Bullets do que precisaria mudar no código atual pra usar a abordagem alternativa. Use \`code\` quando fizer sentido.

### Trade-offs
Tabela markdown:
| Critério | Abordagem atual | Alternativa |
|----------|----------------|-------------|
| Performance | ... | ... |
| Legibilidade | ... | ... |
| Manutenibilidade | ... | ... |
| Quando usar | ... | ... |

(Adapte critérios — adicione "Bundle size", "Type safety", "Testabilidade" se relevante.)

### Quando preferir cada uma
- **Atual** — 1 frase com cenário típico.
- **Alternativa** — 1 frase com cenário típico.

NÃO inclua introdução nem conclusão. Comece direto no "### Resumo da comparação".
`.trim()

export async function generateWhatIf(args: Args): Promise<string> {
  const provider = PROVIDERS[args.providerId]
  const ac = new AbortController()
  const TIMEOUT = 90_000
  const timer = setTimeout(() => ac.abort(), TIMEOUT)

  return new Promise<string>((resolve, reject) => {
    let buf = ''
    provider.invoke({
      prompt: PROMPT(args),
      onChunk: (c) => {
        buf += c
      },
      onDone: () => {
        clearTimeout(timer)
        resolve(buf)
      },
      onError: (err) => {
        clearTimeout(timer)
        reject(err)
      },
      abortSignal: ac.signal
    })
  })
}
