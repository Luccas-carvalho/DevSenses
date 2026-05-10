import type { SeniorityLevel } from '@shared/seniority'

export interface QuizQuestion {
  id: string
  question: string
  correctIdx: number
  options: { label: string; weight: Record<SeniorityLevel, number> }[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'closure',
    question: 'O que é uma closure em JavaScript?',
    correctIdx: 2,
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'Qualquer função declarada dentro de outra', weight: { intern: 0, junior: 2, mid: 0, senior: 0 } },
      {
        label: 'Função que captura (e mantém vivas) as variáveis do escopo onde foi criada',
        weight: { intern: 0, junior: 1, mid: 3, senior: 3 }
      },
      { label: 'Sinônimo de IIFE', weight: { intern: 0, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'react-render',
    question: 'Quando um componente React re-renderiza?',
    correctIdx: 2,
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      {
        label: 'Sempre que qualquer coisa muda na página',
        weight: { intern: 1, junior: 1, mid: 0, senior: 0 }
      },
      {
        label: 'Quando o próprio state/props muda OU o componente pai re-renderiza',
        weight: { intern: 0, junior: 2, mid: 3, senior: 3 }
      },
      {
        label: 'Só quando `setState` é chamado',
        weight: { intern: 1, junior: 1, mid: 0, senior: 0 }
      }
    ]
  },
  {
    id: 'use-effect-deps',
    question: 'Qual o efeito de passar `[]` como array de dependências do `useEffect`?',
    correctIdx: 2,
    options: [
      { label: 'Não sei o que é useEffect', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      {
        label: 'Roda em todo render (igual a não passar dependências)',
        weight: { intern: 1, junior: 1, mid: 0, senior: 0 }
      },
      {
        label: 'Roda só na montagem; cleanup só na desmontagem',
        weight: { intern: 0, junior: 3, mid: 3, senior: 3 }
      },
      { label: 'Desabilita o effect totalmente', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'async-await',
    question: 'O que uma `async function` retorna?',
    correctIdx: 2,
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'Exatamente o valor do `return`', weight: { intern: 1, junior: 0, mid: 0, senior: 0 } },
      {
        label: 'Uma `Promise` que resolve com o valor do `return`',
        weight: { intern: 0, junior: 2, mid: 3, senior: 3 }
      },
      { label: 'Um Observable / stream', weight: { intern: 0, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'memoization',
    question: 'Qual o propósito principal do `useMemo`?',
    correctIdx: 1,
    options: [
      { label: 'Não conheço', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      {
        label: 'Cachear o resultado de uma computação cara entre renders',
        weight: { intern: 0, junior: 2, mid: 3, senior: 3 }
      },
      { label: 'Substituir `useState` para valores derivados', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      {
        label: 'Forçar o componente a re-renderizar imediatamente',
        weight: { intern: 1, junior: 1, mid: 0, senior: 0 }
      }
    ]
  },
  {
    id: 'typescript-generics',
    question: 'O que `function foo<T>(arg: T): T` faz?',
    correctIdx: 2,
    options: [
      { label: 'Não trabalho com TypeScript', weight: { intern: 2, junior: 1, mid: 0, senior: 0 } },
      { label: 'Não entendi a sintaxe', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      {
        label: 'Recebe um valor e devolve um valor do mesmo tipo, preservando o tipo de quem chama',
        weight: { intern: 0, junior: 2, mid: 3, senior: 3 }
      },
      { label: 'Aceita só strings', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'race-condition',
    question: 'Em um componente que faz fetch quando `id` muda, qual é o risco principal sem cancelar requisições?',
    correctIdx: 2,
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      { label: 'A página fica lenta', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      {
        label: 'Race condition: a resposta de um fetch antigo sobrescrever a do novo',
        weight: { intern: 0, junior: 1, mid: 3, senior: 3 }
      },
      { label: 'Memory leak no servidor', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'sql-injection',
    question: 'Qual é a melhor proteção contra SQL injection?',
    correctIdx: 2,
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      {
        label: 'Escapar aspas com `replace` antes de concatenar',
        weight: { intern: 1, junior: 1, mid: 0, senior: 0 }
      },
      {
        label: 'Prepared statements / queries parametrizadas',
        weight: { intern: 0, junior: 2, mid: 3, senior: 3 }
      },
      { label: 'Habilitar HTTPS no servidor', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  }
]

export function scoreQuiz(answers: Record<string, number>): SeniorityLevel {
  if (countCorrect(answers) === QUIZ_QUESTIONS.length) return 'senior'

  const totals: Record<SeniorityLevel, number> = { intern: 0, junior: 0, mid: 0, senior: 0 }
  for (const [qId, optionIdx] of Object.entries(answers)) {
    const q = QUIZ_QUESTIONS.find((x) => x.id === qId)
    const opt = q?.options[optionIdx]
    if (!opt) continue
    for (const lvl of Object.keys(totals) as SeniorityLevel[]) {
      totals[lvl] += opt.weight[lvl]
    }
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0] as SeniorityLevel
}

export function countCorrect(answers: Record<string, number>): number {
  let n = 0
  for (const [qId, optionIdx] of Object.entries(answers)) {
    const q = QUIZ_QUESTIONS.find((x) => x.id === qId)
    if (q && q.correctIdx === optionIdx) n++
  }
  return n
}
