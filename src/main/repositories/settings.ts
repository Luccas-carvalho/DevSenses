import type Database from 'better-sqlite3'
import type { SettingsKey, SettingsValueMap } from '@shared/settings'

export class SettingsRepository {
  private getStmt: Database.Statement
  private setStmt: Database.Statement
  private allStmt: Database.Statement

  constructor(db: Database.Database) {
    this.getStmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    this.setStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `)
    this.allStmt = db.prepare('SELECT key, value FROM settings')
  }

  get<K extends SettingsKey>(key: K): SettingsValueMap[K] | null {
    const row = this.getStmt.get(key) as { value: string } | undefined
    if (!row) return null
    return JSON.parse(row.value) as SettingsValueMap[K]
  }

  set<K extends SettingsKey>(key: K, value: SettingsValueMap[K]): void {
    this.setStmt.run(key, JSON.stringify(value), Date.now())
  }

  all(): Partial<SettingsValueMap> {
    const rows = this.allStmt.all() as { key: string; value: string }[]
    const out: Record<string, unknown> = {}
    for (const r of rows) out[r.key] = JSON.parse(r.value)
    return out as Partial<SettingsValueMap>
  }
}
