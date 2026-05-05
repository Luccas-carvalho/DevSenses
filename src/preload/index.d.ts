import type { IpcChannel, IpcContract, IpcEvents } from '../shared/ipc-contract'

declare global {
  interface Window {
    api: {
      invoke<C extends IpcChannel>(
        channel: C,
        payload: IpcContract[C]['request']
      ): Promise<IpcContract[C]['response']>
      on<E extends keyof IpcEvents>(event: E, listener: (data: IpcEvents[E]) => void): () => void
    }
  }
}

export {}
