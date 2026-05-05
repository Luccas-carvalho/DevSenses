import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { SettingsRepository } from '../repositories/settings'
import type { IpcContract } from '@shared/ipc-contract'

let repo: SettingsRepository | null = null
function getRepo(): SettingsRepository {
  if (!repo) repo = new SettingsRepository(getDb())
  return repo
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', (_, payload: IpcContract['settings:get']['request']) => {
    return getRepo().get(payload.key)
  })

  ipcMain.handle('settings:set', (_, payload: IpcContract['settings:set']['request']) => {
    getRepo().set(payload.key, payload.value)
  })

  ipcMain.handle('settings:all', () => {
    return getRepo().all()
  })
}
