import { registerSettingsHandlers } from './settings'
import { registerProviderHandlers } from './providers'
import { registerWorkspaceHandlers } from './workspace'
import { registerConceptsHandlers } from './concepts'
import { registerAnalysesHandlers } from './analyses'
import { registerQuizzesHandlers } from './quizzes'
import { registerTestsHandlers } from './tests'
import { registerGitHandlers } from './git-ops'
import { registerRepositoryHandlers } from './repository'
import { registerTelemetryHandlers } from './telemetry'

export function registerIpcHandlers(): void {
  registerSettingsHandlers()
  registerProviderHandlers()
  registerWorkspaceHandlers()
  registerConceptsHandlers()
  registerAnalysesHandlers()
  registerQuizzesHandlers()
  registerTestsHandlers()
  registerGitHandlers()
  registerRepositoryHandlers()
  registerTelemetryHandlers()
}
