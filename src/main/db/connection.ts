import Database from 'better-sqlite3'
import { dbPath } from '../utils/paths'

let instance: Database.Database | null = null

export function getDb(): Database.Database {
  if (instance) return instance
  instance = new Database(dbPath())
  instance.pragma('journal_mode = WAL')
  instance.pragma('foreign_keys = ON')
  return instance
}

export function closeDb(): void {
  if (instance) {
    instance.close()
    instance = null
  }
}
