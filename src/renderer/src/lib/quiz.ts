import type { SeniorityLevel } from '@shared/seniority'

export interface QuizQuestion {
  id: string
  question: string
  options: { label: string; weight: Record<SeniorityLevel, number> }[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'closure',
    question: 'O que é uma closure em JavaScript?',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'Função dentro de outra função', weight: { intern: 0, junior: 2, mid: 0, senior: 0 } },
      {
        label: 'Função que captura variáveis do escopo onde foi criada',
        weight: { intern: 0, junior: 1, mid: 3, senior: 3 }
      },
      { label: 'Mesma coisa que IIFE', weight: { intern: 0, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'react-render',
    question: 'Quando um componente React re-renderiza?',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      {
        label: 'Sempre que algo na página muda',
        weight: { intern: 1, junior: 1, mid: 0, senior: 0 }
      },
      {
        label: 'Quando state ou props mudam, ou o pai re-renderiza',
        weight: { intern: 0, junior: 2, mid: 3, senior: 2 }
      },
      {
        label: 'Só quando setState é chamado e o React decide via fiber reconciler',
        weight: { intern: 0, junior: 0, mid: 2, senior: 3 }
      }
    ]
  },
  {
    id: 'use-effect-deps',
    question: 'Qual o efeito de `[]` como dependências do useEffect?',
    options: [
      { label: 'Não sei o que é useEffect', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      {
        label: 'Roda toda vez que o componente renderiza',
        weight: { intern: 1, junior: 1, mid: 0, senior: 0 }
      },
      {
        label: 'Roda só na montagem (e cleanup na desmontagem)',
        weight: { intern: 0, junior: 3, mid: 3, senior: 3 }
      },
      { label: 'Roda só uma vez no app inteiro', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'async-await',
    question: '`async function` retorna…',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      { label: 'O valor que dei no `return`', weight: { intern: 1, junior: 0, mid: 0, senior: 0 } },
      {
        label: 'Uma Promise que resolve com o valor do return',
        weight: { intern: 0, junior: 2, mid: 3, senior: 3 }
      },
      { label: 'Um observable', weight: { intern: 0, junior: 0, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'memoization',
    question: '`useMemo` serve pra…',
    options: [
      { label: 'Não conheço', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      {
        label: 'Memorizar valores entre renders pra evitar recomputar',
        weight: { intern: 0, junior: 2, mid: 3, senior: 2 }
      },
      { label: 'Substituir `useState`', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      {
        label: 'Memoizar quando o cost-benefit faz sentido — geralmente é over-used',
        weight: { intern: 0, junior: 0, mid: 2, senior: 3 }
      }
    ]
  },
  {
    id: 'typescript-generics',
    question: 'O que faz `function foo<T>(arg: T): T`?',
    options: [
      { label: 'Não trabalho com TS', weight: { intern: 2, junior: 1, mid: 0, senior: 0 } },
      { label: 'Não entendi a sintaxe', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      {
        label: 'Recebe e devolve algo do mesmo tipo, preservando o tipo',
        weight: { intern: 0, junior: 2, mid: 3, senior: 3 }
      },
      { label: 'Aceita só strings', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  },
  {
    id: 'race-condition',
    question: 'Em um componente que faz fetch quando o `id` muda, qual o risco principal?',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 1, mid: 0, senior: 0 } },
      { label: 'Lentidão', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } },
      {
        label: 'Race condition: resposta antiga sobrescrever a nova',
        weight: { intern: 0, junior: 1, mid: 3, senior: 3 }
      },
      { label: 'Memory leak', weight: { intern: 0, junior: 1, mid: 1, senior: 1 } }
    ]
  },
  {
    id: 'sql-injection',
    question: 'Qual a melhor proteção contra SQL injection?',
    options: [
      { label: 'Não sei', weight: { intern: 3, junior: 0, mid: 0, senior: 0 } },
      {
        label: 'Escapar aspas com replace',
        weight: { intern: 1, junior: 1, mid: 0, senior: 0 }
      },
      {
        label: 'Prepared statements / parameterized queries',
        weight: { intern: 0, junior: 2, mid: 3, senior: 3 }
      },
      { label: 'Usar HTTPS', weight: { intern: 1, junior: 1, mid: 0, senior: 0 } }
    ]
  }
]

export function scoreQuiz(answers: Record<string, number>): SeniorityLevel {
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
