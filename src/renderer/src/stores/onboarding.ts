import { create } from 'zustand'
import type { SettingsValueMap } from '@shared/settings'

export type OnboardingStep =
  | 'welcome'
  | 'name'
  | 'providers'
  | 'test'
  | 'model'
  | 'seniority'
  | 'theme'
  | 'workspace'
  | 'summary'

export const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'name',
  'providers',
  'test',
  'model',
  'seniority',
  'theme',
  'workspace',
  'summary'
]

type Draft = Partial<SettingsValueMap>

interface OnboardingState {
  step: OnboardingStep
  draft: Draft

  goNext: () => void
  goPrev: () => void
  goTo: (step: OnboardingStep) => void
  setDraft: <K extends keyof Draft>(key: K, value: Draft[K]) => void
  reset: () => void
}

const INITIAL_DRAFT: Draft = {
  user_name: '',
  seniority: 'junior',
  seniority_source: 'manual',
  provider_default: 'claude',
  provider_model: 'claude-sonnet-4-6',
  provider_tested: {},
  theme: 'auto',
  last_workspace: null
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
  step: 'welcome',
  draft: { ...INITIAL_DRAFT },

  goNext: () => {
    const idx = STEP_ORDER.indexOf(get().step)
    if (idx < STEP_ORDER.length - 1) set({ step: STEP_ORDER[idx + 1] })
  },
  goPrev: () => {
    const idx = STEP_ORDER.indexOf(get().step)
    if (idx > 0) set({ step: STEP_ORDER[idx - 1] })
  },
  goTo: (step) => set({ step }),
  setDraft: (key, value) => set((s) => ({ draft: { ...s.draft, [key]: value } })),
  reset: () => set({ step: 'welcome', draft: { ...INITIAL_DRAFT } })
}))
