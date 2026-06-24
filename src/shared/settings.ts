export type ThemeMode = 'dark' | 'light' | 'auto'
export type DiffMode = 'all' | 'uncommitted' | 'committed'
export type ExplanationDepth = 1 | 2 | 3 | 4 | 5
export type ExplanationPersona = 'default' | 'sarcastic' | 'pragmatic' | 'academic' | 'mentor'
export type CodeThemeId =
  | 'default'
  | 'classic'
  | 'dracula'
  | 'monokai'
  | 'github'
  | 'oneDark'
  | 'tokyoNight'
  | 'nord'
  | 'solarized'

export interface SettingsValueMap {
  onboarding_completed: boolean
  user_name: string
  user_avatar: string
  seniority: 'intern' | 'junior' | 'mid' | 'senior'
  seniority_source: 'manual' | 'quiz'
  provider_default: 'claude' | 'codex' | 'gemini' | 'aider' | 'ollama'
  provider_model: string
  provider_tested: Record<string, boolean>
  theme: ThemeMode
  code_theme: CodeThemeId
  last_workspace: string | null
  professor_turbo: boolean
  explanation_depth: ExplanationDepth
  explanation_persona: ExplanationPersona
  socratic_mode: boolean
  code_review_enabled: boolean
  diff_mode: DiffMode
  editor_default: string
  terminal_default: string
  update_strategy: 'merge' | 'rebase'
  auto_fetch: boolean
  telemetry_enabled: boolean
}

export type SettingsKey = keyof SettingsValueMap

export const SETTINGS_DEFAULTS: SettingsValueMap = {
  onboarding_completed: false,
  user_name: '',
  user_avatar: '',
  seniority: 'junior',
  seniority_source: 'manual',
  provider_default: 'claude',
  provider_model: 'claude-sonnet-4-6',
  provider_tested: {},
  theme: 'auto',
  code_theme: 'default',
  last_workspace: null,
  professor_turbo: false,
  explanation_depth: 3,
  explanation_persona: 'default',
  socratic_mode: false,
  code_review_enabled: false,
  diff_mode: 'all',
  editor_default: '',
  terminal_default: '',
  update_strategy: 'merge',
  auto_fetch: true,
  telemetry_enabled: false
}
