import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannel, IpcContract, IpcEvents } from '@shared/ipc-contract'

const api = {
  invoke<C extends IpcChannel>(
    channel: C,
    payload: IpcContract[C]['request']
  ): Promise<IpcContract[C]['response']> {
    return ipcRenderer.invoke(channel, payload)
  },
  on<E extends keyof IpcEvents>(event: E, listener: (data: IpcEvents[E]) => void): () => void {
    const wrapped = (_: unknown, data: IpcEvents[E]): void => listener(data)
    ipcRenderer.on(event, wrapped)
    return () => ipcRenderer.removeListener(event, wrapped)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
