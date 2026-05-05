import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { ConceptsRepository } from '../repositories/concepts'
import type { IpcContract } from '@shared/ipc-contract'

let repo: ConceptsRepository | null = null
function getRepo(): ConceptsRepository {
  if (!repo) repo = new ConceptsRepository(getDb())
  return repo
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
}
