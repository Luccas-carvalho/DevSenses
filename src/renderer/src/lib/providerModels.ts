export interface ModelOption {
  id: string
  label: string
  tag?: string
}

export const PROVIDER_MODELS: Record<string, ModelOption[]> = {
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

export const PROVIDER_LABELS: Record<string, string> = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
  aider: 'Aider',
  ollama: 'Ollama'
}

export const DEFAULT_MODEL: Record<string, string> = {
  claude: 'claude-sonnet-4-6',
  codex: 'o4-mini',
  gemini: 'gemini-2.0-flash',
  aider: 'gpt-4o',
  ollama: 'llama3.2'
}
