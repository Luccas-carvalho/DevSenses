import { PROVIDERS } from '../providers/registry'
import type { ProviderId } from '@shared/providers'

export interface QuizDraft {
  question: string
  options: string[]
  correctIdx: number
  explainCorrect: string
  explainWrong: string
  concepts?: string[]
}

interface Args {
  analysisText: string
  seniority: string
  providerId: ProviderId
  count?: number
  weakConcepts?: string[]
  masteredConcepts?: string[]
}

const PROMPT_TEMPLATE = (
  analysis: string,
  seniority: string,
  n: number,
  weak: string[],
  mastered: string[]
): string => {
  const weakBlock = weak.length
    ? `\nCONCEITOS QUE O USUÁRIO AINDA NÃO DOMINA (priorize testar estes):\n- ${weak.join('\n- ')}\n`
    : ''
  const masteredBlock = mastered.length
    ? `\nCONCEITOS JÁ DOMINADOS (NÃO refaça questões sobre estes — só pergunte se aparecem em contexto novo):\n- ${mastered.join('\n- ')}\n`
    : ''
  return `
Você é um tutor que acabou de explicar este diff de código pra um dev nível "${seniority}".

EXPLICAÇÃO QUE FOI DADA:
"""
${analysis.slice(0, 4000)}
"""
${weakBlock}${masteredBlock}
Tarefa: gere ${n} perguntas múltipla-escolha que testam o conceito MAIS central da explicação acima.

Regras:
- Cada pergunta deve ter exatamente 4 alternativas.
- Apenas UMA alternativa correta.
- Distratores devem ser plausíveis (erros comuns), não absurdos.
- Adapte vocabulário pro nível "${seniority}".
- Evite perguntas triviais ("o que é uma variável?"). Foque no que aquele diff ensina.
- Se houver conceitos não-dominados acima, PRIORIZE eles ao formular perguntas.
- Evite testar conceitos já dominados a menos que o contexto novo exija.
- "concepts": 1-3 nomes curtos dos conceitos centrais que essa pergunta testa (ex: ["useState", "closure"]). Use o nome canônico, snake_case ou camelCase apenas. Sem espaços a menos que essencial.
- "explainCorrect": 1-2 frases reforçando POR QUE a correta está certa.
- "explainWrong": 1 frase apontando o erro mais comum entre os distratores.

Output: apenas JSON válido, NADA mais. Schema:
[
  {
    "question": "string",
    "options": ["string","string","string","string"],
    "correctIdx": 0,
    "concepts": ["string"],
    "explainCorrect": "string",
    "explainWrong": "string"
  }
]
`.trim()
}

function extractJsonArray(text: string): unknown {
  // Try fenced ```json block first
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)```/i)
  if (fence) {
    try {
      return JSON.parse(fence[1])
    } catch {
      // continue
    }
  }
  // Find first `[` and matching last `]`
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON array found in response')
  }
  return JSON.parse(text.slice(start, end + 1))
}

function isValidDraft(x: unknown): x is QuizDraft {
  if (!x || typeof x !== 'object') return false
  const r = x as Record<string, unknown>
  const baseOk =
    typeof r.question === 'string' &&
    Array.isArray(r.options) &&
    r.options.length === 4 &&
    r.options.every((o) => typeof o === 'string') &&
    typeof r.correctIdx === 'number' &&
    r.correctIdx >= 0 &&
    r.correctIdx < 4 &&
    typeof r.explainCorrect === 'string' &&
    typeof r.explainWrong === 'string'
  if (!baseOk) return false
  if (r.concepts != null) {
    if (!Array.isArray(r.concepts)) return false
    if (!r.concepts.every((c) => typeof c === 'string')) return false
  }
  return true
}

async function callProvider(providerId: ProviderId, prompt: string): Promise<string> {
  const provider = PROVIDERS[providerId]
  const ac = new AbortController()
  const TIMEOUT = 60_000
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

export async function generateQuiz(args: Args): Promise<QuizDraft[]> {
  const n = args.count ?? (args.analysisText.length > 1500 ? 3 : 2)
  const prompt = PROMPT_TEMPLATE(
    args.analysisText,
    args.seniority,
    n,
    args.weakConcepts ?? [],
    args.masteredConcepts ?? []
  )

  let raw: string
  try {
    raw = await callProvider(args.providerId, prompt)
  } catch (err) {
    throw new Error(`Falha ao gerar quiz: ${(err as Error).message}`)
  }

  let parsed: unknown
  try {
    parsed = extractJsonArray(raw)
  } catch {
    // One retry with stricter instruction
    const retry = await callProvider(
      args.providerId,
      `${prompt}\n\nIMPORTANTE: responda APENAS o JSON. Nada antes, nada depois. Sem markdown.`
    )
    parsed = extractJsonArray(retry)
  }

  if (!Array.isArray(parsed)) throw new Error('Resposta não é um array JSON')
  const valid = parsed.filter(isValidDraft)
  if (valid.length === 0) throw new Error('Nenhuma pergunta válida no output da IA')

  return valid
}
