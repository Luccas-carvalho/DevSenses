import type { ProviderId } from '@shared/providers'

export interface InvokeOptions {
  prompt: string
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: Error) => void
  abortSignal?: AbortSignal
}

export interface AIProvider {
  id: ProviderId
  binary(): string
  buildArgs(opts: { prompt: string; testMode?: boolean }): string[]
  detectVersion(binaryPath: string): Promise<string | null>
  invoke(opts: InvokeOptions): Promise<void>
}
