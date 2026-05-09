import type Database from 'better-sqlite3'

export interface SeenConcept {
  id: number
  name: string
  category: string
  language: string | null
  framework: string | null
  firstSeenAt: number
  timesSeen: number
  markedLearned: boolean
  lastNote: string | null
}

export class ConceptsRepository {
  private upsertConceptStmt: Database.Statement
  private findIdStmt: Database.Statement
  private upsertSeenStmt: Database.Statement
  private listStmt: Database.Statement
  private toggleLearnedStmt: Database.Statement
  private updateNoteStmt: Database.Statement
  private noteCol: boolean

  constructor(db: Database.Database) {
    this.ensureExtraColumns(db)
    this.noteCol = this.hasColumn(db, 'user_seen_concepts', 'last_note')

    this.upsertConceptStmt = db.prepare(`
      INSERT INTO concepts (name, category, language, framework)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name, language, framework) DO NOTHING
    `)
    this.findIdStmt = db.prepare(`
      SELECT id FROM concepts
      WHERE name = ? AND
        COALESCE(language, '') = COALESCE(?, '') AND
        COALESCE(framework, '') = COALESCE(?, '')
    `)
    this.upsertSeenStmt = db.prepare(`
      INSERT INTO user_seen_concepts (concept_id, first_seen_at, times_seen, marked_learned, last_note)
      VALUES (?, ?, 1, 0, ?)
      ON CONFLICT(concept_id) DO UPDATE SET
        times_seen = times_seen + 1,
        last_note = COALESCE(excluded.last_note, last_note)
    `)
    this.listStmt = db.prepare(`
      SELECT
        c.id, c.name, c.category, c.language, c.framework,
        s.first_seen_at AS firstSeenAt,
        s.times_seen   AS timesSeen,
        s.marked_learned AS markedLearned,
        ${this.noteCol ? 's.last_note' : 'NULL'} AS lastNote
      FROM concepts c
      INNER JOIN user_seen_concepts s ON s.concept_id = c.id
      ORDER BY s.first_seen_at DESC
    `)
    this.toggleLearnedStmt = db.prepare(`
      UPDATE user_seen_concepts SET marked_learned = ? WHERE concept_id = ?
    `)
    this.updateNoteStmt = db.prepare(`
      UPDATE user_seen_concepts SET last_note = ? WHERE concept_id = ?
    `)
  }

  private hasColumn(db: Database.Database, table: string, column: string): boolean {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
    return cols.some((c) => c.name === column)
  }

  private ensureExtraColumns(db: Database.Database): void {
    if (!this.hasColumn(db, 'user_seen_concepts', 'last_note')) {
      try {
        db.prepare(`ALTER TABLE user_seen_concepts ADD COLUMN last_note TEXT`).run()
      } catch {
        // ignore — older sqlite or already exists
      }
    }
  }

  /**
   * Insert concept (if missing) and increment seen counter.
   * Returns whether the concept was first-seen in this call.
   */
  upsertSeen(input: {
    name: string
    category?: string
    language?: string
    framework?: string
    note?: string
  }): { id: number; firstTime: boolean } {
    const language = input.language ?? null
    const framework = input.framework ?? null
    this.upsertConceptStmt.run(
      input.name,
      input.category ?? 'general',
      language,
      framework
    )
    const row = this.findIdStmt.get(input.name, language, framework) as
      | { id: number }
      | undefined
    if (!row) return { id: -1, firstTime: false }

    const before = (this.listStmt.all() as SeenConcept[]).find((c) => c.id === row.id)
    const firstTime = !before
    this.upsertSeenStmt.run(row.id, Date.now(), input.note ?? null)
    return { id: row.id, firstTime }
  }

  list(): SeenConcept[] {
    return this.listStmt.all().map((r) => {
      const row = r as Record<string, unknown>
      return {
        id: row.id as number,
        name: row.name as string,
        category: row.category as string,
        language: (row.language as string | null) ?? null,
        framework: (row.framework as string | null) ?? null,
        firstSeenAt: row.firstSeenAt as number,
        timesSeen: row.timesSeen as number,
        markedLearned: Boolean(row.markedLearned),
        lastNote: (row.lastNote as string | null) ?? null
      }
    })
  }

  toggleLearned(id: number, learned: boolean): void {
    this.toggleLearnedStmt.run(learned ? 1 : 0, id)
  }

  updateNote(id: number, note: string | null): void {
    if (!this.noteCol) return
    this.updateNoteStmt.run(note, id)
  }

  getDefinition(name: string): { definition: string; example: string } | null {
    const row = this.findIdStmt.get(name, null, null) as { id: number } | undefined
    if (!row) return null
    const def = this.upsertConceptStmt.database
      .prepare('SELECT definition, example FROM concepts WHERE id = ?')
      .get(row.id) as { definition: string | null; example: string | null } | undefined
    if (!def || !def.definition) return null
    return { definition: def.definition, example: def.example ?? '' }
  }

  upsertDefinition(name: string, definition: string, example: string): void {
    const db = this.upsertConceptStmt.database
    db.prepare(
      `INSERT INTO concepts (name, category, language, framework, definition, example, updated_at)
       VALUES (?, 'general', NULL, NULL, ?, ?, ?)
       ON CONFLICT(name, language, framework) DO UPDATE SET
         definition = excluded.definition,
         example = excluded.example,
         updated_at = excluded.updated_at`
    ).run(name, definition, example, Date.now())
  }

  // ─── Mastery ────────────────────────────────────────────────────────────
  /**
   * Find or create a concept by name (no language/framework specifier).
   * Returns id.
   */
  findOrCreate(name: string): number {
    const db = this.upsertConceptStmt.database
    db.prepare(
      `INSERT INTO concepts (name, category, language, framework)
       VALUES (?, 'general', NULL, NULL)
       ON CONFLICT(name, language, framework) DO NOTHING`
    ).run(name)
    const row = db
      .prepare(
        `SELECT id FROM concepts
         WHERE name = ? AND COALESCE(language, '') = '' AND COALESCE(framework, '') = ''`
      )
      .get(name) as { id: number } | undefined
    return row?.id ?? -1
  }

  recordAttempt(conceptId: number, correct: boolean): { masteryLevel: number; learnedNow: boolean } {
    const db = this.upsertConceptStmt.database
    const now = Date.now()

    // upsert
    db.prepare(
      `INSERT INTO concept_mastery (concept_id, correct_count, wrong_count, consecutive_correct, mastery_level, last_attempt_at)
       VALUES (?, ?, ?, ?, 0, ?)
       ON CONFLICT(concept_id) DO UPDATE SET
         correct_count = correct_count + ?,
         wrong_count = wrong_count + ?,
         consecutive_correct = CASE WHEN ? = 1 THEN consecutive_correct + 1 ELSE 0 END,
         last_attempt_at = ?`
    ).run(
      conceptId,
      correct ? 1 : 0,
      correct ? 0 : 1,
      correct ? 1 : 0,
      now,
      correct ? 1 : 0,
      correct ? 0 : 1,
      correct ? 1 : 0,
      now
    )

    // Compute mastery level: 0=novice, 1=familiar, 2=proficient, 3=mastered
    const row = db
      .prepare(
        `SELECT correct_count, wrong_count, consecutive_correct
         FROM concept_mastery WHERE concept_id = ?`
      )
      .get(conceptId) as
      | { correct_count: number; wrong_count: number; consecutive_correct: number }
      | undefined
    if (!row) return { masteryLevel: 0, learnedNow: false }

    let level = 0
    if (row.consecutive_correct >= 3 && row.correct_count >= 3) level = 2
    if (row.consecutive_correct >= 5 && row.correct_count >= 5) level = 3
    if (row.correct_count >= 1 && level === 0) level = 1
    if (row.wrong_count > row.correct_count) level = Math.max(0, level - 1)

    db.prepare('UPDATE concept_mastery SET mastery_level = ? WHERE concept_id = ?').run(
      level,
      conceptId
    )

    let learnedNow = false
    if (level >= 3) {
      // Auto-mark learned
      db.prepare(
        `INSERT INTO user_seen_concepts (concept_id, first_seen_at, times_seen, marked_learned)
         VALUES (?, ?, 1, 1)
         ON CONFLICT(concept_id) DO UPDATE SET marked_learned = 1`
      ).run(conceptId, now)
      learnedNow = true
    }

    return { masteryLevel: level, learnedNow }
  }

  /**
   * Returns concept names with weak mastery (<=1) seen recently OR never attempted yet.
   * Used to bias quiz generation.
   */
  weakConceptNames(limit = 12): string[] {
    const db = this.upsertConceptStmt.database
    const rows = db
      .prepare(
        `SELECT c.name, COALESCE(m.mastery_level, 0) AS level, COALESCE(m.last_attempt_at, 0) AS last_at
         FROM concepts c
         INNER JOIN user_seen_concepts s ON s.concept_id = c.id
         LEFT JOIN concept_mastery m ON m.concept_id = c.id
         WHERE COALESCE(m.mastery_level, 0) <= 1
           AND s.marked_learned = 0
         ORDER BY last_at ASC, s.first_seen_at DESC
         LIMIT ?`
      )
      .all(limit) as { name: string }[]
    return rows.map((r) => r.name)
  }

  /**
   * Returns concept names already mastered (level >= 3).
   */
  masteredConceptNames(limit = 20): string[] {
    const db = this.upsertConceptStmt.database
    const rows = db
      .prepare(
        `SELECT c.name FROM concepts c
         INNER JOIN concept_mastery m ON m.concept_id = c.id
         WHERE m.mastery_level >= 3
         ORDER BY m.last_attempt_at DESC
         LIMIT ?`
      )
      .all(limit) as { name: string }[]
    return rows.map((r) => r.name)
  }

  /**
   * Concepts seen since a given timestamp, joined with mastery.
   */
  seenSince(sinceMs: number): Array<{
    name: string
    firstSeenAt: number
    timesSeen: number
    masteryLevel: number
  }> {
    const db = this.upsertConceptStmt.database
    const rows = db
      .prepare(
        `SELECT c.name AS name,
                s.first_seen_at AS firstSeenAt,
                s.times_seen AS timesSeen,
                COALESCE(m.mastery_level, 0) AS masteryLevel
         FROM concepts c
         INNER JOIN user_seen_concepts s ON s.concept_id = c.id
         LEFT JOIN concept_mastery m ON m.concept_id = c.id
         WHERE s.first_seen_at >= ?
            OR (m.last_attempt_at IS NOT NULL AND m.last_attempt_at >= ?)
         ORDER BY s.first_seen_at DESC`
      )
      .all(sinceMs, sinceMs) as Array<{
      name: string
      firstSeenAt: number
      timesSeen: number
      masteryLevel: number
    }>
    return rows
  }

  getMastery(name: string): { level: number; correct: number; wrong: number } | null {
    const db = this.upsertConceptStmt.database
    const row = db
      .prepare(
        `SELECT m.mastery_level AS level, m.correct_count AS correct, m.wrong_count AS wrong
         FROM concepts c
         INNER JOIN concept_mastery m ON m.concept_id = c.id
         WHERE c.name = ? AND COALESCE(c.language, '') = '' AND COALESCE(c.framework, '') = ''`
      )
      .get(name) as { level: number; correct: number; wrong: number } | undefined
    return row ?? null
  }
}
