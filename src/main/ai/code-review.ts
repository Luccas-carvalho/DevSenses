import { PROVIDERS } from '../providers/registry'
import type { ProviderId } from '@shared/providers'
import type { CodeReview, ReviewSeverity } from '@shared/codeReview'

interface Args {
  diff: string
  seniority: string
  providerId: ProviderId
}

const PROMPT = (args: Args): string =>
  `
Você é um revisor de código sênior e didático. Revise o DIFF abaixo e devolva uma avaliação estruturada. O dev tem nível "${args.seniority}" — calibre o tom, mas seja honesto na nota.

DIFF:
\`\`\`diff
${args.diff.slice(0, 12000)}
\`\`\`

Responda APENAS um objeto JSON (sem markdown, sem texto antes/depois) com EXATAMENTE esta forma:

{
  "grade": 8.5,
  "summary": "1-2 frases justificando a nota.",
  "issues": [
    {
      "severity": "critical" | "medium" | "low",
      "title": "título curto do problema",
      "file": "caminho/do/arquivo.tsx",
      "line": 42,
      "detail": "o que está errado e por quê, em linguagem clara"
    }
  ],
  "strengths": ["o que foi bem feito (frases curtas)"],
  "suggestions": [
    { "title": "ação concreta de melhoria", "example": "trecho de código opcional" }
  ]
}

Regras:
- "grade": número de 0 a 10 (uma casa decimal). 10 = excelente, sem ressalvas.
- "severity": use "critical" só pra bug real/segurança/quebra; "medium" pra problemas de qualidade; "low" pra estilo/nitpick.
- "file" e "line" são opcionais — só preencha se conseguir identificar no diff.
- Se não houver issues, devolva "issues": []. Idem pra strengths/suggestions.
- Seja específico ao diff. Nada genérico.
`.trim()

function extractJsonObject(text: string): unknown {
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
    throw new Error('No JSON object found in response')
  }
  return JSON.parse(text.slice(start, end + 1))
}

const SEVERITIES: ReviewSeverity[] = ['critical', 'medium', 'low']

function normalize(raw: unknown): CodeReview {
  if (!raw || typeof raw !== 'object') throw new Error('Review não é um objeto JSON')
  const r = raw as Record<string, unknown>

  const gradeNum = typeof r.grade === 'number' ? r.grade : Number(r.grade)
  const grade = Number.isFinite(gradeNum) ? Math.min(10, Math.max(0, gradeNum)) : 0

  const issues = Array.isArray(r.issues)
    ? r.issues
        .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
        .map((i) => ({
          severity: (SEVERITIES.includes(i.severity as ReviewSeverity)
            ? i.severity
            : 'medium') as ReviewSeverity,
          title: String(i.title ?? 'Problema'),
          detail: String(i.detail ?? ''),
          ...(typeof i.file === 'string' ? { file: i.file } : {}),
          ...(typeof i.line === 'number' ? { line: i.line } : {})
        }))
    : []

  const strengths = Array.isArray(r.strengths)
    ? r.strengths.filter((s): s is string => typeof s === 'string')
    : []

  const suggestions = Array.isArray(r.suggestions)
    ? r.suggestions
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          title: String(s.title ?? ''),
          ...(typeof s.example === 'string' ? { example: s.example } : {})
        }))
        .filter((s) => s.title.length > 0)
    : []

  return {
    grade: Math.round(grade * 10) / 10,
    summary: String(r.summary ?? ''),
    issues,
    strengths,
    suggestions
  }
}

async function callProvider(providerId: ProviderId, prompt: string): Promise<string> {
  const provider = PROVIDERS[providerId]
  const ac = new AbortController()
  const TIMEOUT = 90_000
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

export async function generateCodeReview(args: Args): Promise<CodeReview> {
  const prompt = PROMPT(args)

  let raw: string
  try {
    raw = await callProvider(args.providerId, prompt)
  } catch (err) {
    throw new Error(`Falha ao gerar review: ${(err as Error).message}`)
  }

  try {
    return normalize(extractJsonObject(raw))
  } catch {
    // Uma tentativa com instrução mais estrita
    const retry = await callProvider(
      args.providerId,
      `${prompt}\n\nIMPORTANTE: responda APENAS o JSON. Nada antes, nada depois. Sem markdown.`
    )
    return normalize(extractJsonObject(retry))
  }
}
