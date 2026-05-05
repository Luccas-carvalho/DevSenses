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
}
