import type { ProviderId } from '@shared/providers'
import type { AIProvider } from './types'
import { claudeProvider } from './claude'
import { codexProvider } from './codex'
import { geminiProvider } from './gemini'
import { aiderProvider } from './aider'
import { ollamaProvider } from './ollama'

export const PROVIDERS: Record<ProviderId, AIProvider> = {
  claude: claudeProvider,
  codex: codexProvider,
  gemini: geminiProvider,
  aider: aiderProvider,
  ollama: ollamaProvider
}
