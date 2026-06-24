import { create } from 'zustand'
import { DEFAULT_PROVIDER_MODELS, type ModelOption } from '@shared/providers'

type ModelsMap = Record<string, ModelOption[]>

interface ProviderModelsState {
  /** Mapa atual de modelos por provider. Começa nos defaults e é substituído
   *  pela lista "ao vivo" (models.json local + `ollama list`) após o fetch. */
  models: ModelsMap
  /** true depois que o IPC respondeu ao menos uma vez. */
  ready: boolean
  /** Busca a lista do main. Idempotente o suficiente pra chamar no boot. */
  fetch: () => Promise<void>
}

/**
 * Fonte "ao vivo" dos modelos. Os componentes leem `models` de forma síncrona
 * (já vem semeado com os defaults), então não precisam de estado de loading.
 * O App dispara `fetch()` uma vez no início pra trocar pelos valores locais.
 */
export const useProviderModels = create<ProviderModelsState>((set) => ({
  models: DEFAULT_PROVIDER_MODELS,
  ready: false,
  fetch: async () => {
    try {
      const live = await window.api.invoke('providers:listModels', undefined)
      set({ models: live, ready: true })
    } catch {
      // mantém os defaults já semeados
      set({ ready: true })
    }
  }
}))
