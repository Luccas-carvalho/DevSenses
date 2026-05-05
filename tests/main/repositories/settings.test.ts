import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { SettingsRepository } from '../../../src/main/repositories/settings'

describe('SettingsRepository', () => {
  let db: Database.Database
  let repo: SettingsRepository

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
    repo = new SettingsRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('get retorna null quando key nao existe', () => {
    expect(repo.get('user_name')).toBeNull()
  })

  it('set + get roundtrip string', () => {
    repo.set('user_name', 'Luccas')
    expect(repo.get('user_name')).toBe('Luccas')
  })

  it('set + get roundtrip boolean', () => {
    repo.set('onboarding_completed', true)
    expect(repo.get('onboarding_completed')).toBe(true)
  })

  it('set + get roundtrip object', () => {
    repo.set('provider_tested', { claude: true, codex: false })
    expect(repo.get('provider_tested')).toEqual({ claude: true, codex: false })
  })

  it('set faz upsert (atualiza)', () => {
    repo.set('user_name', 'A')
    repo.set('user_name', 'B')
    expect(repo.get('user_name')).toBe('B')
  })

  it('all retorna todas chaves setadas', () => {
    repo.set('user_name', 'Luccas')
    repo.set('seniority', 'mid')
    expect(repo.all()).toEqual({ user_name: 'Luccas', seniority: 'mid' })
  })
})
