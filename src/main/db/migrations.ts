import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  sql: string
}

export const EMBEDDED_MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial',
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recent_workspaces (
        path TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        last_opened_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS recent_workspaces_last_opened_idx
        ON recent_workspaces (last_opened_at DESC);
    `
  },
  {
    version: 2,
    name: 'seen_concepts',
    sql: `
      CREATE TABLE IF NOT EXISTS concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        language TEXT,
        framework TEXT,
        UNIQUE(name, language, framework)
      );

      CREATE TABLE IF NOT EXISTS user_seen_concepts (
        concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
        first_seen_at INTEGER NOT NULL,
        times_seen INTEGER NOT NULL DEFAULT 1,
        marked_learned INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (concept_id)
      );
    `
  },
  {
    version: 3,
    name: 'analyses_history',
    sql: `
      CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_path TEXT NOT NULL,
        project_name TEXT NOT NULL,
        branch TEXT NOT NULL,
        diff_mode TEXT NOT NULL,
        files_count INTEGER NOT NULL,
        additions INTEGER NOT NULL DEFAULT 0,
        deletions INTEGER NOT NULL DEFAULT 0,
        diff TEXT NOT NULL,
        analysis TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        seniority TEXT NOT NULL,
        professor_turbo INTEGER NOT NULL DEFAULT 0,
        title TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS analyses_project_idx
        ON analyses (project_path, created_at DESC);

      CREATE INDEX IF NOT EXISTS analyses_branch_idx
        ON analyses (project_path, branch, created_at DESC);
    `
  },
  {
    version: 4,
    name: 'telemetry',
    sql: `
      CREATE TABLE IF NOT EXISTS telemetry_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        payload TEXT,
        created_at INTEGER NOT NULL,
        flushed INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_telemetry_event ON telemetry_events(event);
      CREATE INDEX IF NOT EXISTS idx_telemetry_flushed ON telemetry_events(flushed, created_at);
    `
  }
]

export function loadMigrations(dir: string): Migration[] {
  return readdirSync(dir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .map((file) => {
      const match = file.match(/^(\d+)_(.+)\.sql$/)!
      return {
        version: parseInt(match[1], 10),
        name: match[2],
        sql: readFileSync(join(dir, file), 'utf-8')
      }
    })
    .sort((a, b) => a.version - b.version)
}

function runFromList(db: Database.Database, list: Migration[]): number[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `)

  const applied = new Set(
    db.prepare('SELECT version FROM schema_version').all().map((r) => (r as { version: number }).version)
  )

  const ranNow: number[] = []

  for (const m of list) {
    if (applied.has(m.version)) continue
    const tx = db.transaction(() => {
      db.exec(m.sql)
      db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(m.version, Date.now())
    })
    tx()
    ranNow.push(m.version)
  }

  return ranNow
}

export function runMigrations(db: Database.Database, dir: string): number[] {
  return runFromList(db, loadMigrations(dir))
}

export function runEmbeddedMigrations(db: Database.Database): number[] {
  return runFromList(db, EMBEDDED_MIGRATIONS)
}
