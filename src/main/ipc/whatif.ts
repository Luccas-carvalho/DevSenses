import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { SettingsRepository } from '../repositories/settings'
import { generateWhatIf } from '../ai/whatif'
import type { IpcContract } from '@shared/ipc-contract'
import type { ProviderId } from '@shared/providers'

let settings: SettingsRepository | null = null
function getSettings(): SettingsRepository {
  if (!settings) settings = new SettingsRepository(getDb())
  return settings
}

export function registerWhatIfHandlers(): void {
  ipcMain.handle('ai:whatIf', async (_, payload: IpcContract['ai:whatIf']['request']) => {
    const providerId = (getSettings().get('provider_default') as ProviderId | null) ?? 'claude'
    const seniority = (getSettings().get('seniority') as string | null) ?? 'junior'
    return generateWhatIf({
      diff: payload.diff,
      alternative: payload.alternative,
      seniority,
      providerId
    })
  })
}
