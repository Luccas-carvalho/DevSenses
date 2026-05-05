import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

export function dataDir(): string {
  const base = app?.isReady?.()
    ? app.getPath('userData')
    : join(process.env.HOME ?? process.env.USERPROFILE ?? '.', '.devsenses-test')
  mkdirSync(base, { recursive: true })
  return base
}

export function dbPath(): string {
  return join(dataDir(), 'devsenses.db')
}
