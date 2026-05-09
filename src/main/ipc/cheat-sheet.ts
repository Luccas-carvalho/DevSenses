import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { SettingsRepository } from '../repositories/settings'
import { generateCheatSheet } from '../ai/cheat-sheet'
import type { IpcContract } from '@shared/ipc-contract'
import type { ProviderId } from '@shared/providers'

let settings: SettingsRepository | null = null
function getSettings(): SettingsRepository {
  if (!settings) settings = new SettingsRepository(getDb())
  return settings
}

export function registerCheatSheetHandlers(): void {
  ipcMain.handle(
    'ai:cheatSheet',
    async (_, payload: IpcContract['ai:cheatSheet']['request']) => {
      const providerId = (getSettings().get('provider_default') as ProviderId | null) ?? 'claude'
      const seniority = (getSettings().get('seniority') as string | null) ?? 'junior'
      return generateCheatSheet({
        selection: payload.selection,
        language: payload.language,
        seniority,
        providerId
      })
    }
  )
}
