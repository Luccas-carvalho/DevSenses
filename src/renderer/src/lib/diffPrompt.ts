import type { SeniorityLevel } from '@shared/seniority'

const LEVEL_INSTRUCTIONS: Record<SeniorityLevel, string> = {
  intern:
    'Você está explicando para alguém aprendendo a programar. Use linguagem simples, explique cada conceito técnico (hooks, operadores, padrões, libs) e dê exemplos práticos do que cada mudança faz no mundo real.',
  junior:
    'Explique o que mudou, por que foi feito, e quais padrões/bibliotecas estão envolvidos. Aponte possíveis problemas ou melhorias.',
  mid:
    'Análise técnica: o que mudou, impactos, possíveis bugs introduzidos, oportunidades de melhoria de código e performance.',
  senior:
    'Revisão sênior direta: arquitetura, performance, segurança, anti-patterns, trade-offs. Aponte problemas críticos primeiro.'
}

const FORMAT_INSTRUCTION = `
FORMATO OBRIGATÓRIO da resposta. Comece SEMPRE com um bloco "## Resumo" de 2 a 4 frases curtas explicando o que mudou no diff de modo geral (sem detalhar linha por linha). Depois de uma linha em branco, abra outro bloco "## Detalhes" e dentro dele liste UM bloco por mudança alterada relevante usando EXATAMENTE essa estrutura:

### Linha N (NomeDoArquivo.ext): título curto da mudança

**Antes:**
\`\`\`
código antes
\`\`\`

**Depois:**
\`\`\`
código depois
\`\`\`

**Por que:** uma frase explicando a motivação real da mudança.

**Conceitos:** (bullets curtos, só se houver conceitos não-triviais — operadores, padrões, métodos)
- \`conceito\`: explicação rápida

---

REGRAS:
- Use o número da linha do lado "+ " (linha NOVA do arquivo).
- SEMPRE inclua o nome do arquivo entre parênteses no cabeçalho (basename apenas, sem path completo).
- Se houver várias mudanças no mesmo arquivo, repita o bloco para cada uma.
- O "## Resumo" vem PRIMEIRO, seguido de "## Detalhes". Não use outras seções.
- NÃO escreva introdução nem conclusão fora dos dois blocos.
`

export function buildDiffPrompt(
  diff: string,
  seniority: SeniorityLevel,
  professorTurbo: boolean
): string {
  const instruction = LEVEL_INSTRUCTIONS[seniority]
  const turbo = professorTurbo
    ? 'MODO PROFESSOR TURBO ATIVO: Explique absolutamente tudo em detalhes, mesmo conceitos óbvios para um sênior. Não assuma conhecimento prévio.\n\n'
    : ''

  return `${turbo}${instruction}${FORMAT_INSTRUCTION}\n\nDiff a analisar:\n\`\`\`diff\n${diff.slice(0, 12_000)}\n\`\`\``
}
