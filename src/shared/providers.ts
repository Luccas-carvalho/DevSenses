export const PROVIDER_IDS = ['claude', 'codex', 'gemini', 'aider', 'ollama'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export interface ProviderStatus {
  installed: boolean
  binaryPath: string | null
  version: string | null
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
