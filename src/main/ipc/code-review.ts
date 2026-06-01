import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { SettingsRepository } from '../repositories/settings'
import { generateCodeReview } from '../ai/code-review'
import type { IpcContract } from '@shared/ipc-contract'
import type { ProviderId } from '@shared/providers'

let settings: SettingsRepository | null = null
function getSettings(): SettingsRepository {
  if (!settings) settings = new SettingsRepository(getDb())
  return settings
}

export function registerCodeReviewHandlers(): void {
  ipcMain.handle('ai:codeReview', async (_, payload: IpcContract['ai:codeReview']['request']) => {
    const providerId = (getSettings().get('provider_default') as ProviderId | null) ?? 'claude'
    const seniority = (getSettings().get('seniority') as string | null) ?? 'junior'
    return generateCodeReview({
      diff: payload.diff,
      seniority,
      providerId
    })
  })
}
