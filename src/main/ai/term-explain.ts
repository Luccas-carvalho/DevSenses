import { PROVIDERS } from '../providers/registry'
import type { ProviderId } from '@shared/providers'

export interface TermExplanation {
  definition: string
  example: string
}

interface Args {
  term: string
  contextSnippet: string
  seniority: string
  providerId: ProviderId
}

const PROMPT = (term: string, ctx: string, seniority: string): string => `
Você é tutor. Explique o termo técnico "${term}" para um dev nível "${seniority}".

Contexto onde apareceu (trecho de código ou texto):
"""
${ctx.slice(0, 800)}
"""

Regras:
- "definition": 2-3 frases. Direto, sem rodeio. Linguagem adaptada ao nível.
- "example": uma linha ou snippet curto (max 60 caracteres) demonstrando o conceito. Se não couber código, dê analogia em uma frase.

Output: apenas JSON válido, NADA mais. Schema:
{ "definition": "string", "example": "string" }
`.trim()

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)```/i)
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
  const TIMEOUT = 30_000
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

export async function explainTerm(args: Args): Promise<TermExplanation> {
  const raw = await callProvider(args.providerId, PROMPT(args.term, args.contextSnippet, args.seniority))
  const parsed = extractJson(raw) as Record<string, unknown>
  if (typeof parsed.definition !== 'string' || typeof parsed.example !== 'string') {
    throw new Error('Resposta da IA inválida')
  }
  return { definition: parsed.definition, example: parsed.example }
}
