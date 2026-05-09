import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { QuizzesRepository, type QuizRecord } from '../repositories/quizzes'
import { AnalysesRepository } from '../repositories/analyses'
import { ConceptsRepository } from '../repositories/concepts'
import { generateQuiz } from '../ai/quiz-generator'
import type { IpcContract } from '@shared/ipc-contract'
import type { ProviderId } from '@shared/providers'

let quizRepo: QuizzesRepository | null = null
let analysesRepo: AnalysesRepository | null = null
let conceptsRepo: ConceptsRepository | null = null

function getQuizRepo(): QuizzesRepository {
  if (!quizRepo) quizRepo = new QuizzesRepository(getDb())
  return quizRepo
}

function getAnalysesRepo(): AnalysesRepository {
  if (!analysesRepo) analysesRepo = new AnalysesRepository(getDb())
  return analysesRepo
}

function getConceptsRepo(): ConceptsRepository {
  if (!conceptsRepo) conceptsRepo = new ConceptsRepository(getDb())
  return conceptsRepo
}

export function registerQuizzesHandlers(): void {
  ipcMain.handle(
    'quiz:generate',
    async (_, payload: IpcContract['quiz:generate']['request']): Promise<QuizRecord[]> => {
      const existing = getQuizRepo().byAnalysis(payload.analysisId)
      if (existing.length > 0 && !payload.regenerate) return existing

      const analysis = getAnalysesRepo().get(payload.analysisId)
      if (!analysis) throw new Error('Análise não encontrada')

      const concepts = getConceptsRepo()
      const weakConcepts = concepts.weakConceptNames(10)
      const masteredConcepts = concepts.masteredConceptNames(15)

      const drafts = await generateQuiz({
        analysisText: analysis.analysis,
        seniority: analysis.seniority,
        providerId: analysis.providerId as ProviderId,
        weakConcepts,
        masteredConcepts
      })

      const inserts = drafts.map((d) => ({
        analysisId: payload.analysisId,
        question: d.question,
        options: d.options,
        correctIdx: d.correctIdx,
        explainCorrect: d.explainCorrect,
        explainWrong: d.explainWrong,
        conceptIds: (d.concepts ?? [])
          .map((name) => concepts.findOrCreate(name.trim()))
          .filter((id) => id > 0)
      }))

      return getQuizRepo().insertMany(inserts)
    }
  )

  ipcMain.handle('quiz:answer', (_, payload: IpcContract['quiz:answer']['request']) => {
    const quiz = getQuizRepo().get(payload.id)
    if (!quiz) return null
    const updated = getQuizRepo().answer(payload.id, payload.idx)
    if (!updated) return null

    // Update mastery for each linked concept
    const conceptIds = getQuizRepo().conceptIdsFor(payload.id)
    const correct = payload.idx === quiz.correctIdx
    for (const cid of conceptIds) {
      getConceptsRepo().recordAttempt(cid, correct)
    }

    return updated
  })

  ipcMain.handle('quiz:byAnalysis', (_, payload: IpcContract['quiz:byAnalysis']['request']) => {
    return getQuizRepo().byAnalysis(payload.analysisId)
  })
}
