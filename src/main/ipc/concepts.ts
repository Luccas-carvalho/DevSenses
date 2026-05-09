import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { ConceptsRepository } from '../repositories/concepts'
import { SettingsRepository } from '../repositories/settings'
import { explainTerm } from '../ai/term-explain'
import type { IpcContract } from '@shared/ipc-contract'
import type { ProviderId } from '@shared/providers'

let repo: ConceptsRepository | null = null
let settingsRepoInst: SettingsRepository | null = null
function getRepo(): ConceptsRepository {
  if (!repo) repo = new ConceptsRepository(getDb())
  return repo
}
function getSettingsRepo(): SettingsRepository {
  if (!settingsRepoInst) settingsRepoInst = new SettingsRepository(getDb())
  return settingsRepoInst
}

export function registerConceptsHandlers(): void {
  ipcMain.handle('concepts:upsert', (_, payload: IpcContract['concepts:upsert']['request']) => {
    return getRepo().upsertSeen(payload)
  })

  ipcMain.handle('concepts:list', () => {
    return getRepo().list()
  })

  ipcMain.handle(
    'concepts:setLearned',
    (_, payload: IpcContract['concepts:setLearned']['request']) => {
      getRepo().toggleLearned(payload.id, payload.learned)
    }
  )

  ipcMain.handle('concepts:setNote', (_, payload: IpcContract['concepts:setNote']['request']) => {
    getRepo().updateNote(payload.id, payload.note)
  })

  ipcMain.handle('concepts:seenSince', (_, payload: IpcContract['concepts:seenSince']['request']) => {
    return getRepo().seenSince(payload.since)
  })

  ipcMain.handle(
    'concepts:masteryBatch',
    (_, payload: IpcContract['concepts:masteryBatch']['request']) => {
      const out: Record<string, { level: number; correct: number; wrong: number } | null> = {}
      for (const name of payload.names) {
        out[name] = getRepo().getMastery(name)
      }
      return out
    }
  )

  ipcMain.handle(
    'concepts:explainTerm',
    async (_, payload: IpcContract['concepts:explainTerm']['request']) => {
      const cached = getRepo().getDefinition(payload.term)
      if (cached && !payload.regenerate) return cached

      const providerId =
        (getSettingsRepo().get('provider_default') as ProviderId | null) ?? 'claude'
      const seniority =
        (getSettingsRepo().get('seniority') as string | null) ?? 'junior'

      const result = await explainTerm({
        term: payload.term,
        contextSnippet: payload.contextSnippet ?? '',
        seniority,
        providerId
      })

      getRepo().upsertDefinition(payload.term, result.definition, result.example)
      getRepo().upsertSeen({ name: payload.term, category: 'general' })
      return result
    }
  )
}
