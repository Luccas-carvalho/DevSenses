import { describe, it, expect } from 'vitest'
import { scoreQuiz, QUIZ_QUESTIONS } from '../../src/renderer/src/lib/quiz'

describe('scoreQuiz', () => {
  it('todas "nao sei" → intern', () => {
    const answers: Record<string, number> = {}
    for (const q of QUIZ_QUESTIONS) {
      answers[q.id] = 0
    }
    expect(scoreQuiz(answers)).toBe('intern')
  })

  it('respostas top-tier → senior', () => {
    const answers: Record<string, number> = {
      closure: 2,
      'react-render': 3,
      'use-effect-deps': 2,
      'async-await': 2,
      memoization: 3,
      'typescript-generics': 2,
      'race-condition': 2,
      'sql-injection': 2
    }
    expect(scoreQuiz(answers)).toBe('senior')
  })

  it('respostas mistas basicas → junior', () => {
    const answers: Record<string, number> = {
      closure: 1,
      'react-render': 2,
      'use-effect-deps': 2,
      'async-await': 1,
      memoization: 1,
      'typescript-generics': 1,
      'race-condition': 1,
      'sql-injection': 1
    }
    expect(scoreQuiz(answers)).toBe('junior')
  })
})
