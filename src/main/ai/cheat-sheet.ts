import { PROVIDERS } from '../providers/registry'
import type { ProviderId } from '@shared/providers'

interface Args {
  selection: string
  language?: string
  seniority: string
  providerId: ProviderId
}

const PROMPT = (args: Args): string => `
Você é tutor. Gere um cheat-sheet em Markdown sobre o trecho de código abaixo, calibrado pra dev "${args.seniority}".

${args.language ? `Linguagem: ${args.language}` : ''}

TRECHO:
\`\`\`
${args.selection.slice(0, 2000)}
\`\`\`

Estrutura OBRIGATÓRIA do cheat-sheet (markdown puro, sem ## "Cheat Sheet"):

### O que faz
2-3 frases.

### Sintaxe / API
Bullets curtos com a API/sintaxe relevante. Use \`code\`.

### Gotchas
3-5 bullets sobre erros comuns, edge cases, pegadinhas.

### Exemplos rápidos
2-3 mini-snippets em \`\`\`code blocks\`\`\` com 1 linha de descrição cada.

### Quando NÃO usar
1-2 bullets.

NÃO inclua introdução nem conclusão. Comece direto no "### O que faz".
`.trim()

export async function generateCheatSheet(args: Args): Promise<string> {
  const provider = PROVIDERS[args.providerId]
  const ac = new AbortController()
  const TIMEOUT = 60_000
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
