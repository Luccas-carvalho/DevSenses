import { registerSettingsHandlers } from './settings'
import { registerProviderHandlers } from './providers'
import { registerWorkspaceHandlers } from './workspace'
import { registerConceptsHandlers } from './concepts'
import { registerAnalysesHandlers } from './analyses'

export function registerIpcHandlers(): void {
  registerSettingsHandlers()
  registerProviderHandlers()
  registerWorkspaceHandlers()
  registerConceptsHandlers()
  registerAnalysesHandlers()
}
