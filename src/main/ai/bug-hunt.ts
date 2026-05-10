import { PROVIDERS } from '../providers/registry'
import type { ProviderId } from '@shared/providers'

export interface BugHuntChallenge {
  buggyCode: string
  language: string
  hint: string
  bugLine?: number
  explanation: string
  fixedCode: string
}

interface Args {
  snippet: string
  language?: string
  seniority: string
  providerId: ProviderId
}

const PROMPT = (args: Args): string => `
Você é tutor. Receba o trecho de código abaixo e gere um desafio "caça ao bug" pra um dev "${args.seniority}".

CÓDIGO ORIGINAL:
\`\`\`${args.language ?? ''}
${args.snippet.slice(0, 1500)}
\`\`\`

Regras:
- Pegue o código original e introduza UM BUG SUTIL — algo que passa despercebido em revisão rápida (off-by-one, comparação com tipo errado, condição invertida, side-effect inesperado, race condition latente, mutação acidental, etc).
- O bug deve ser plausível como erro real de dev cansado, NÃO um typo grosseiro.
- "buggyCode": código completo com o bug injetado. Mantenha indentação e estilo original.
- "language": linguagem detectada (ex: "ts", "js", "py").
- "hint": 1 frase apontando uma área SEM revelar o bug (ex: "olha bem o predicado do filter").
- "bugLine": número da linha onde está o bug (1-indexed dentro do snippet retornado).
- "explanation": 2-3 frases explicando o que está errado e por que falha.
- "fixedCode": código corrigido (mesma linha onde tá o bug, mas certa).

Output: APENAS JSON válido. Sem markdown.
{
  "buggyCode": "string",
  "language": "string",
  "hint": "string",
  "bugLine": 0,
  "explanation": "string",
  "fixedCode": "string"
}
`.trim()

function extractJson(text: string): unknown {
  const fence = text.match(/\`\`\`(?:json)?\s*([\s\S]+?)\`\`\`/i)
  if (fence) {
    try {
      return JSON.parse(fence[1])
    } catch {
      // continue
    }
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found')
  }
  return JSON.parse(text.slice(start, end + 1))
}

async function callProvider(providerId: ProviderId, prompt: string): Promise<string> {
  const provider = PROVIDERS[providerId]
  const ac = new AbortController()
  const TIMEOUT = 120_000
  const timer = setTimeout(() => ac.abort(), TIMEOUT)
  return new Promise<string>((resolve, reject) => {
    let buf = ''
    provider.invoke({
      prompt,
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

export async function generateBugHunt(args: Args): Promise<BugHuntChallenge> {
  const raw = await callProvider(args.providerId, PROMPT(args))
  const parsed = extractJson(raw) as Record<string, unknown>
  if (
    typeof parsed.buggyCode !== 'string' ||
    typeof parsed.hint !== 'string' ||
    typeof parsed.explanation !== 'string' ||
    typeof parsed.fixedCode !== 'string'
  ) {
    throw new Error('Resposta da IA inválida')
  }
  return {
    buggyCode: parsed.buggyCode,
    language: typeof parsed.language === 'string' ? parsed.language : (args.language ?? ''),
    hint: parsed.hint,
    bugLine: typeof parsed.bugLine === 'number' ? parsed.bugLine : undefined,
    explanation: parsed.explanation,
    fixedCode: parsed.fixedCode
  }
}
