import type Database from 'better-sqlite3'

export interface QuizRecord {
  id: number
  analysisId: number
  question: string
  options: string[]
  correctIdx: number
  explainCorrect: string
  explainWrong: string
  userAnswerIdx: number | null
  answeredAt: number | null
  createdAt: number
}

export interface QuizInsert {
  analysisId: number
  question: string
  options: string[]
  correctIdx: number
  explainCorrect: string
  explainWrong: string
}

interface Row {
  id: number
  analysis_id: number
  question: string
  options_json: string
  correct_idx: number
  explain_correct: string
  explain_wrong: string
  user_answer_idx: number | null
  answered_at: number | null
  created_at: number
}

function rowToRecord(row: Row): QuizRecord {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    question: row.question,
    options: JSON.parse(row.options_json) as string[],
    correctIdx: row.correct_idx,
    explainCorrect: row.explain_correct,
    explainWrong: row.explain_wrong,
    userAnswerIdx: row.user_answer_idx,
    answeredAt: row.answered_at,
    createdAt: row.created_at
  }
}

export class QuizzesRepository {
  constructor(private db: Database.Database) {}

  insertMany(items: QuizInsert[]): QuizRecord[] {
    const stmt = this.db.prepare(`
      INSERT INTO quizzes (
        analysis_id, question, options_json, correct_idx,
        explain_correct, explain_wrong, created_at
      ) VALUES (
        @analysisId, @question, @optionsJson, @correctIdx,
        @explainCorrect, @explainWrong, @createdAt
      )
    `)
    const ids: number[] = []
    const tx = this.db.transaction(() => {
      for (const it of items) {
        const r = stmt.run({
          analysisId: it.analysisId,
          question: it.question,
          optionsJson: JSON.stringify(it.options),
          correctIdx: it.correctIdx,
          explainCorrect: it.explainCorrect,
          explainWrong: it.explainWrong,
          createdAt: Date.now()
        })
        ids.push(Number(r.lastInsertRowid))
      }
    })
    tx()
    return this.byIds(ids)
  }

  byIds(ids: number[]): QuizRecord[] {
    if (ids.length === 0) return []
    const placeholders = ids.map(() => '?').join(',')
    const rows = this.db
      .prepare(`SELECT * FROM quizzes WHERE id IN (${placeholders}) ORDER BY id ASC`)
      .all(...ids) as Row[]
    return rows.map(rowToRecord)
  }

  byAnalysis(analysisId: number): QuizRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM quizzes WHERE analysis_id = ? ORDER BY id ASC')
      .all(analysisId) as Row[]
    return rows.map(rowToRecord)
  }

  answer(id: number, idx: number): QuizRecord | null {
    this.db
      .prepare('UPDATE quizzes SET user_answer_idx = ?, answered_at = ? WHERE id = ?')
      .run(idx, Date.now(), id)
    const row = this.db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as Row | undefined
    return row ? rowToRecord(row) : null
  }

  get(id: number): QuizRecord | null {
    const row = this.db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as Row | undefined
    return row ? rowToRecord(row) : null
  }
}
