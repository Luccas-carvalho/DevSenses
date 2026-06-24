export const PROVIDER_IDS = ['claude', 'codex', 'gemini', 'aider', 'ollama'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export interface ProviderStatus {
  installed: boolean
  binaryPath: string | null
  version: string | null
}

export interface ModelOption {
  id: string
  label: string
  tag?: string
}

/**
 * Lista-semente de modelos por provider. É o FALLBACK final: o app tenta
 * primeiro o `models.json` local (editável pelo usuário) e, quando o CLI
 * permite listar sem ser interativo (ex: `ollama list`), mescla por cima.
 * Estes valores só aparecem quando nada mais responde.
 */
export const DEFAULT_PROVIDER_MODELS: Record<ProviderId, ModelOption[]> = {
  claude: [
    { id: 'claude-opus-4-7', label: 'Opus 4.7', tag: 'mais capaz' },
    { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', tag: 'recomendado' },
    { id: 'claude-sonnet-4-5', label: 'Sonnet 4.5' },
    { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', tag: 'rápido' }
  ],
  codex: [
    { id: 'o4-mini', label: 'o4-mini', tag: 'rápido' },
    { id: 'o3', label: 'o3', tag: 'mais capaz' },
    { id: 'gpt-4o', label: 'GPT-4o' }
  ],
  gemini: [
    { id: 'gemini-2.5-pro', label: '2.5 Pro', tag: 'mais capaz' },
    { id: 'gemini-2.0-flash', label: '2.0 Flash', tag: 'recomendado' },
    { id: 'gemini-1.5-pro', label: '1.5 Pro' }
  ],
  aider: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
    { id: 'gemini/gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
  ],
  ollama: [
    { id: 'llama3.2', label: 'Llama 3.2' },
    { id: 'qwen2.5-coder', label: 'Qwen 2.5 Coder', tag: 'code' },
    { id: 'codestral', label: 'Codestral', tag: 'code' },
    { id: 'mistral', label: 'Mistral' },
    { id: 'deepseek-coder-v2', label: 'DeepSeek Coder V2', tag: 'code' }
  ]
}

export const DEFAULT_MODEL: Record<ProviderId, string> = {
  claude: 'claude-sonnet-4-6',
  codex: 'o4-mini',
  gemini: 'gemini-2.0-flash',
  aider: 'gpt-4o',
  ollama: 'llama3.2'
}

export interface ProviderMeta {
  id: ProviderId
  label: string
  description: string
  binaryName: string
  homepage: string
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  claude: {
    id: 'claude',
    label: 'Claude Code',
    description: 'CLI oficial Anthropic',
    binaryName: 'claude',
    homepage: 'https://docs.claude.com/en/docs/claude-code'
  },
  codex: {
    id: 'codex',
    label: 'OpenAI Codex',
    description: 'CLI oficial OpenAI',
    binaryName: 'codex',
    homepage: 'https://github.com/openai/codex'
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini CLI',
    description: 'CLI oficial Google',
    binaryName: 'gemini',
    homepage: 'https://github.com/google-gemini/gemini-cli'
  },
  aider: {
    id: 'aider',
    label: 'Aider',
    description: 'CLI multi-provider open-source',
    binaryName: 'aider',
    homepage: 'https://aider.chat'
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama',
    description: 'LLMs locais (sem API key)',
    binaryName: 'ollama',
    homepage: 'https://ollama.com'
  }
}
