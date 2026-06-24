import {
  DEFAULT_PROVIDER_MODELS,
  DEFAULT_MODEL as SHARED_DEFAULT_MODEL,
  type ModelOption
} from '@shared/providers'

export type { ModelOption }

/**
 * Fallback estático. A fonte "ao vivo" é o store useProviderModels (lê do
 * models.json local + `ollama list`); estes valores só entram quando o IPC
 * ainda não respondeu ou falhou.
 */
export const PROVIDER_MODELS: Record<string, ModelOption[]> = DEFAULT_PROVIDER_MODELS

export const DEFAULT_MODEL: Record<string, string> = SHARED_DEFAULT_MODEL

export const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
  aider: 'Aider',
  ollama: 'Ollama'
}
