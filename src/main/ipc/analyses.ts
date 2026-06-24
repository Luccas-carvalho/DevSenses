import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { AnalysesRepository } from '../repositories/analyses'
import type { IpcContract } from '@shared/ipc-contract'

let repo: AnalysesRepository | null = null
function getRepo(): AnalysesRepository {
  if (!repo) repo = new AnalysesRepository(getDb())
  return repo
}

export function registerAnalysesHandlers(): void {
  ipcMain.handle('analyses:save', (_, payload: IpcContract['analyses:save']['request']) => {
    return getRepo().insert(payload)
  })

  ipcMain.handle('analyses:list', (_, payload: IpcContract['analyses:list']['request']) => {
    return getRepo().list(payload.path, payload.branch)
  })

  ipcMain.handle('analyses:get', (_, payload: IpcContract['analyses:get']['request']) => {
    return getRepo().get(payload.id)
  })

  ipcMain.handle(
    'analyses:updateReview',
    (_, payload: IpcContract['analyses:updateReview']['request']) => {
      getRepo().updateReview(payload.id, payload.review)
    }
  )

  ipcMain.handle('analyses:delete', (_, payload: IpcContract['analyses:delete']['request']) => {
    getRepo().delete(payload.id)
  })

  ipcMain.handle(
    'analyses:clearProject',
    (_, payload: IpcContract['analyses:clearProject']['request']) => {
      getRepo().clearProject(payload.path)
    }
  )
}
