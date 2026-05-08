import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { QuizzesRepository, type QuizRecord } from '../repositories/quizzes'
import { AnalysesRepository } from '../repositories/analyses'
import { generateQuiz } from '../ai/quiz-generator'
import type { IpcContract } from '@shared/ipc-contract'
import type { ProviderId } from '@shared/providers'

let quizRepo: QuizzesRepository | null = null
let analysesRepo: AnalysesRepository | null = null

function getQuizRepo(): QuizzesRepository {
  if (!quizRepo) quizRepo = new QuizzesRepository(getDb())
  return quizRepo
}

function getAnalysesRepo(): AnalysesRepository {
  if (!analysesRepo) analysesRepo = new AnalysesRepository(getDb())
  return analysesRepo
}

export function registerQuizzesHandlers(): void {
  ipcMain.handle(
    'quiz:generate',
    async (_, payload: IpcContract['quiz:generate']['request']): Promise<QuizRecord[]> => {
      const existing = getQuizRepo().byAnalysis(payload.analysisId)
      if (existing.length > 0 && !payload.regenerate) return existing

      const analysis = getAnalysesRepo().get(payload.analysisId)
      if (!analysis) throw new Error('Análise não encontrada')

      const drafts = await generateQuiz({
        analysisText: analysis.analysis,
        seniority: analysis.seniority,
        providerId: analysis.providerId as ProviderId
      })

      const inserts = drafts.map((d) => ({
        analysisId: payload.analysisId,
        question: d.question,
        options: d.options,
        correctIdx: d.correctIdx,
        explainCorrect: d.explainCorrect,
        explainWrong: d.explainWrong
      }))

      return getQuizRepo().insertMany(inserts)
    }
  )

  ipcMain.handle('quiz:answer', (_, payload: IpcContract['quiz:answer']['request']) => {
    return getQuizRepo().answer(payload.id, payload.idx)
  })

  ipcMain.handle('quiz:byAnalysis', (_, payload: IpcContract['quiz:byAnalysis']['request']) => {
    return getQuizRepo().byAnalysis(payload.analysisId)
  })
}
