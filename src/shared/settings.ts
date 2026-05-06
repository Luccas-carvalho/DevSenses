export type ThemeMode = 'dark' | 'light' | 'auto'
export type DiffMode = 'all' | 'uncommitted' | 'committed'
export type CodeThemeId =
  | 'default'
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
  diff_mode: DiffMode
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
  diff_mode: 'all'
}
