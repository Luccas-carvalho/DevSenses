import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { SettingsRepository } from '../repositories/settings'
import { generateBugHunt } from '../ai/bug-hunt'
import type { IpcContract } from '@shared/ipc-contract'
import type { ProviderId } from '@shared/providers'

let settings: SettingsRepository | null = null
function getSettings(): SettingsRepository {
  if (!settings) settings = new SettingsRepository(getDb())
  return settings
}

export function registerBugHuntHandlers(): void {
  ipcMain.handle('ai:bugHunt', async (_, payload: IpcContract['ai:bugHunt']['request']) => {
    const providerId = (getSettings().get('provider_default') as ProviderId | null) ?? 'claude'
    const seniority = (getSettings().get('seniority') as string | null) ?? 'junior'
    return generateBugHunt({
      snippet: payload.snippet,
      language: payload.language,
      seniority,
      providerId
    })
  })
}
