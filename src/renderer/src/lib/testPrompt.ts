export interface TestActionDescriptor {
  action: 'goto' | 'fill' | 'click' | 'press' | 'expectVisible' | 'expectText' | 'wait' | 'screenshot'
  url?: string
  path?: string
  selector?: string
  value?: string
  key?: string
  text?: string
  ms?: number
  name?: string
}

const SCHEMA = `Cada passo é UM objeto JSON com a chave "action". Tipos disponíveis e campos:

- {"action":"goto"}                                     // navega pra baseUrl exatamente
- {"action":"goto","path":"/login"}                     // navega pra baseUrl + path RELATIVO
- {"action":"fill","selector":"input[name=email]","value":"test@x.com"}
- {"action":"click","selector":"button[type=submit]"}
- {"action":"press","selector":"input[name=q]","key":"Enter"}
- {"action":"expectVisible","selector":".dashboard"}
- {"action":"expectText","selector":"h1","text":"Bem vindo"}
- {"action":"wait","ms":500}
- {"action":"screenshot","name":"login-final"}

REGRAS RÍGIDAS:
- O runner NAVEGA SOZINHO pra baseUrl no início. NÃO precisa "goto" no começo a menos que o usuário cite um sub-path específico ("/login", "/checkout", etc).
- NUNCA invente paths. Se o usuário não citou "/algo", NÃO use "goto" com path. Apenas baseUrl.
- NUNCA use a chave "url" — só "path" (e somente se o usuário pediu).
- Use seletores CSS robustos: \`text=\`, \`role=\`, atributos data-testid quando óbvios.
- Tire screenshot ao final de cada etapa significativa (\`screenshot\` action).
- Use "expectVisible"/"expectText" pra confirmar que algo carregou antes de prosseguir.
- Mantenha o teste curto e focado (máximo 15 ações).`

const INTENSITY_HINTS = {
  sane:
    'Modo SANE: testa apenas o caminho feliz descrito pelo usuário. Sem inputs aleatórios.',
  chaos:
    'Modo CHAOS: além do caminho descrito, faz ~3 ações de fuzz (textos longos, caracteres especiais em inputs, cliques em locais inesperados). Captura screenshot após cada chaos action.',
  nuclear:
    'Modo NUCLEAR: além de chaos, alterna navegação rápida (back/forward), reload no meio do fluxo, abrir links e voltar. Use "wait" curtos pra deixar a página estabilizar entre ações brutas.'
}

export function buildTestPrompt(input: {
  baseUrl: string
  prompt: string
  intensity: 'sane' | 'chaos' | 'nuclear'
}): string {
  const { baseUrl, prompt, intensity } = input
  return `Você é um agente de teste de UI. Vai gerar um JSON com a sequência de ações Playwright para validar o cenário descrito.

baseUrl: ${baseUrl}
${INTENSITY_HINTS[intensity]}

Cenário do usuário:
"""
${prompt}
"""

${SCHEMA}

RESPOSTA OBRIGATÓRIA: APENAS um array JSON válido entre \`\`\`json e \`\`\`. SEM texto antes ou depois. Exemplo (sem path, abre na home):

\`\`\`json
[
  {"action":"expectVisible","selector":"body"},
  {"action":"screenshot","name":"home"}
]
\`\`\`
`
}

export function extractActionsJson(text: string): TestActionDescriptor[] | null {
  // Try to find a fenced block first
  const fence = text.match(/```(?:json)?\s*\n([\s\S]*?)\n?```/)
  const candidate = fence ? fence[1] : text
  // Find first '[' and matching last ']'
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return null
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.filter(
      (it): it is TestActionDescriptor =>
        typeof it === 'object' && it !== null && typeof (it as { action?: unknown }).action === 'string'
    )
  } catch {
    return null
  }
}
