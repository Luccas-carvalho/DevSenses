import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import CodeThemeApplicator from './components/CodeThemeApplicator'
import { router } from './routes'
import { useAnalysisStore } from './stores/analysis'
import { useProviderModels } from './stores/providerModels'
import './lib/prismLanguages'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Escuta o stream de Explicação IA no nível do app (uma vez só), não no
 * componente Project. Garante que os chunks continuem sendo acumulados na
 * store mesmo quando o usuário sai da tela do projeto durante a análise.
 */
function AnalysisStreamBridge(): null {
  React.useEffect(() => {
    return window.api.on('providers:stream', (event) => {
      useAnalysisStore.getState().onStreamEvent(event)
    })
  }, [])
  return null
}

/** Carrega a lista de modelos "ao vivo" (models.json local + `ollama list`)
 *  uma vez no boot, substituindo os defaults semeados no store. */
function ProviderModelsLoader(): null {
  React.useEffect(() => {
    void useProviderModels.getState().fetch()
  }, [])
  return null
}

interface EBState {
  error: Error | null
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  render(): React.ReactNode {
    const { error } = this.state
    if (error) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-8 select-none">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="size-5 text-destructive/70" />
          </div>
          <div className="text-center max-w-sm">
            <h1 className="text-sm font-semibold mb-1">Algo deu errado</h1>
            <p className="text-[11px] text-muted-foreground font-mono leading-relaxed break-all">
              {error.message}
            </p>
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            className="flex items-center gap-1.5 text-xs rounded-md px-3 h-8 border border-border/50 hover:bg-accent/60 transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Tentar de novo
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CodeThemeApplicator />
        <AnalysisStreamBridge />
        <ProviderModelsLoader />
        <RouterProvider router={router} />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
