import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { SettingsRepository } from '../repositories/settings'
import type { IpcContract } from '@shared/ipc-contract'

export function registerTelemetryHandlers(): void {
  ipcMain.handle('telemetry:track', (_, p: IpcContract['telemetry:track']['request']) => {
    const db = getDb()
    const repo = new SettingsRepository(db)
    const enabled = repo.get('telemetry_enabled')
    if (enabled !== true) return
    const payload = p.payload ? JSON.stringify(p.payload) : null
    db.prepare(
      'INSERT INTO telemetry_events (event, payload, created_at, flushed) VALUES (?, ?, ?, 0)'
    ).run(p.event, payload, Date.now())
  })

  ipcMain.handle('telemetry:summary', () => {
    const db = getDb()
    const repo = new SettingsRepository(db)
    const enabled = repo.get('telemetry_enabled') === true
    const totalRow = db.prepare('SELECT COUNT(*) as c FROM telemetry_events').get() as
      | { c: number }
      | undefined
    const rows = db
      .prepare(
        `SELECT event, COUNT(*) as count, MAX(created_at) as lastSeen
         FROM telemetry_events
         GROUP BY event
         ORDER BY count DESC
         LIMIT 50`
      )
      .all() as Array<{ event: string; count: number; lastSeen: number }>
    return {
      total: totalRow?.c ?? 0,
      enabled,
      byEvent: rows
    }
  })

  ipcMain.handle('telemetry:clear', () => {
    const db = getDb()
    db.prepare('DELETE FROM telemetry_events').run()
  })
}
