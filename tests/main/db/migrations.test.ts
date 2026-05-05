import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations, loadMigrations } from '../../../src/main/db/migrations'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('migrations runner', () => {
  let tmp: string
  let migDir: string
  let db: Database.Database

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'devsenses-test-'))
    migDir = join(tmp, 'migrations')
    mkdirSync(migDir, { recursive: true })
    db = new Database(':memory:')
  })

  afterEach(() => {
    db.close()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('aplica migrations em ordem', () => {
    writeFileSync(join(migDir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);')
    writeFileSync(join(migDir, '002_b.sql'), 'CREATE TABLE b (id INTEGER);')

    const ran = runMigrations(db, migDir)
    expect(ran).toEqual([1, 2])

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r) => (r as { name: string }).name)
    expect(tables).toContain('a')
    expect(tables).toContain('b')
  })

  it('e idempotente — segunda chamada nao roda nada', () => {
    writeFileSync(join(migDir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);')
    runMigrations(db, migDir)
    const ran = runMigrations(db, migDir)
    expect(ran).toEqual([])
  })

  it('roda so pendentes quando algumas ja estao aplicadas', () => {
    writeFileSync(join(migDir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);')
    runMigrations(db, migDir)
    writeFileSync(join(migDir, '002_b.sql'), 'CREATE TABLE b (id INTEGER);')
    const ran = runMigrations(db, migDir)
    expect(ran).toEqual([2])
  })

  it('rollback em falha — migration parcial nao fica gravada', () => {
    writeFileSync(join(migDir, '001_bad.sql'), 'CREATE TABLE x (id INTEGER); INVALID SQL HERE;')
    expect(() => runMigrations(db, migDir)).toThrow()
    const versions = db.prepare('SELECT version FROM schema_version').all()
    expect(versions).toEqual([])
  })

  it('loadMigrations ignora arquivos invalidos', () => {
    writeFileSync(join(migDir, 'README.md'), '# whatever')
    writeFileSync(join(migDir, '001_a.sql'), 'CREATE TABLE a (id INTEGER);')
    const list = loadMigrations(migDir)
    expect(list.length).toBe(1)
  })
})
