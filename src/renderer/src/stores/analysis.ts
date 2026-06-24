import { create } from 'zustand'
import type { CodeReview } from '@shared/codeReview'
import { notifyEvent } from '@/lib/notify'

export type AnalysisState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

export type ReviewState = 'idle' | 'loading' | 'done' | 'error'

/**
 * Estado da Explicação IA de um projeto. Mora aqui (global) e não no
 * componente Project pra sobreviver à navegação: o streaming roda no
 * processo main e continua mesmo com a tela desmontada. Ao voltar pro
 * projeto, o painel relê daqui e mostra a análise continuando ou pronta.
 */
export interface AnalysisEntry {
  state: AnalysisState
  text: string
  error: string
  streamId: string | null
  /** id da análise salva no histórico (null = ainda não salva) */
  savedAnalysisId: number | null
  /** texto já persistido no histórico — evita salvar duplicado ao remontar */
  persistedText: string
  /** code review opcional (gerado quando o toggle Review está ligado) */
  review: CodeReview | null
  reviewState: ReviewState
  reviewError: string
  /** id da análise cujo review já foi gravado no histórico (evita re-gravar) */
  reviewPersistedFor: number | null
}

export const EMPTY_ANALYSIS: AnalysisEntry = {
  state: 'idle',
  text: '',
  error: '',
  streamId: null,
  savedAnalysisId: null,
  persistedText: '',
  review: null,
  reviewState: 'idle',
  reviewError: '',
  reviewPersistedFor: null
}

interface AnalysisStore {
  /** uma entrada por caminho de projeto */
  byPath: Record<string, AnalysisEntry>
  /** atualização parcial da entrada de um projeto */
  patch: (path: string, partial: Partial<AnalysisEntry>) => void
  /** evento de stream do main — roteia por streamId pro projeto certo */
  onStreamEvent: (event: {
    streamId: string
    chunk: string
    done: boolean
    error: string | null
  }) => void
}

function findPathByStreamId(
  byPath: Record<string, AnalysisEntry>,
  streamId: string
): string | undefined {
  for (const [path, entry] of Object.entries(byPath)) {
    if (entry.streamId === streamId) return path
  }
  return undefined
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  byPath: {},

  patch: (path, partial) =>
    set((s) => ({
      byPath: {
        ...s.byPath,
        [path]: { ...(s.byPath[path] ?? EMPTY_ANALYSIS), ...partial }
      }
    })),

  onStreamEvent: (event) => {
    const path = findPathByStreamId(get().byPath, event.streamId)
    if (!path) return // stream de um projeto que não está mais no store

    if (event.error) {
      get().patch(path, { state: 'error', error: event.error })
      void notifyEvent({ title: 'Falha na análise', body: event.error, tone: 'error', target: path })
      return
    }
    if (event.done) {
      get().patch(path, { state: 'done' })
      void notifyEvent({
        title: 'Explicação pronta',
        body: 'Seu diff foi explicado.',
        tone: 'success',
        target: path
      })
      return
    }
    const current = get().byPath[path] ?? EMPTY_ANALYSIS
    get().patch(path, { state: 'streaming', text: current.text + event.chunk })
  }
}))
