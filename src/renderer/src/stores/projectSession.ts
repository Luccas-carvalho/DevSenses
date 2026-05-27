import { create } from 'zustand'
import type { AnalysisState, AnalysisTab } from '@/pages/Project/types'

export type SidebarTab = 'changes' | 'history'

interface ProjectSessionState {
  // Tracks the workspace this state belongs to. Mismatch on mount triggers a reset.
  path: string | null

  // Persistent UI state — survives route changes (settings, etc).
  analysisText: string
  analysisState: AnalysisState
  analysisTab: AnalysisTab
  savedAnalysisId: number | null
  viewingAnalysisId: number | null
  fullDiff: string
  sidebarTab: SidebarTab
  sidebarCollapsed: boolean
  viewingCommitHash: string | null
  selectedFile: string | null
  bugHuntSnippet: string
  bugHuntOpen: boolean
  cheatSheetOpen: boolean
  cheatSheetSelection: string
  whatIfOpen: boolean
  historyOpen: boolean
  searchOpen: boolean
  searchQuery: string
  searchIndex: number
  analysisScrollTop: number
  diffScrollTop: number

  ensureWorkspace: (path: string) => void
  setAnalysisText: (v: string | ((prev: string) => string)) => void
  setAnalysisState: (v: AnalysisState) => void
  setAnalysisTab: (v: AnalysisTab) => void
  setSavedAnalysisId: (v: number | null) => void
  setViewingAnalysisId: (v: number | null) => void
  setFullDiff: (v: string) => void
  setSidebarTab: (v: SidebarTab) => void
  setSidebarCollapsed: (v: boolean) => void
  setViewingCommitHash: (v: string | null) => void
  setSelectedFile: (v: string | null) => void
  setBugHunt: (next: { open: boolean; snippet: string }) => void
  setCheatSheet: (next: { open: boolean; selection: string }) => void
  setWhatIfOpen: (v: boolean) => void
  setHistoryOpen: (v: boolean) => void
  setSearchOpen: (v: boolean) => void
  setSearchQuery: (v: string) => void
  setSearchIndex: (v: number) => void
  setAnalysisScrollTop: (v: number) => void
  setDiffScrollTop: (v: number) => void
}

const INITIAL = {
  analysisText: '',
  analysisState: 'idle' as AnalysisState,
  analysisTab: 'summary' as AnalysisTab,
  savedAnalysisId: null,
  viewingAnalysisId: null,
  fullDiff: '',
  sidebarTab: 'changes' as SidebarTab,
  sidebarCollapsed: false,
  viewingCommitHash: null,
  selectedFile: null,
  bugHuntSnippet: '',
  bugHuntOpen: false,
  cheatSheetOpen: false,
  cheatSheetSelection: '',
  whatIfOpen: false,
  historyOpen: false,
  searchOpen: false,
  searchQuery: '',
  searchIndex: 0,
  analysisScrollTop: 0,
  diffScrollTop: 0
}

export const useProjectSession = create<ProjectSessionState>((set) => ({
  path: null,
  ...INITIAL,

  ensureWorkspace: (path) =>
    set((s) => {
      if (s.path === path) return s
      return { path, ...INITIAL }
    }),

  setAnalysisText: (v) =>
    set((s) => ({ analysisText: typeof v === 'function' ? v(s.analysisText) : v })),
  setAnalysisState: (v) =>
    // Streaming/loading/error are transient — never persist across remount.
    // The component coerces them on resume, but we still accept the live value.
    set({ analysisState: v }),
  setAnalysisTab: (v) => set({ analysisTab: v }),
  setSavedAnalysisId: (v) => set({ savedAnalysisId: v }),
  setViewingAnalysisId: (v) => set({ viewingAnalysisId: v }),
  setFullDiff: (v) => set({ fullDiff: v }),
  setSidebarTab: (v) => set({ sidebarTab: v }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setViewingCommitHash: (v) => set({ viewingCommitHash: v }),
  setSelectedFile: (v) => set({ selectedFile: v }),
  setBugHunt: ({ open, snippet }) => set({ bugHuntOpen: open, bugHuntSnippet: snippet }),
  setCheatSheet: ({ open, selection }) =>
    set({ cheatSheetOpen: open, cheatSheetSelection: selection }),
  setWhatIfOpen: (v) => set({ whatIfOpen: v }),
  setHistoryOpen: (v) => set({ historyOpen: v }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setSearchQuery: (v) => set({ searchQuery: v }),
  setSearchIndex: (v) => set({ searchIndex: v }),
  setAnalysisScrollTop: (v) => set({ analysisScrollTop: v }),
  setDiffScrollTop: (v) => set({ diffScrollTop: v })
}))
