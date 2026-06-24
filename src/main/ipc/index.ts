import { registerSettingsHandlers } from './settings'
import { registerProviderHandlers } from './providers'
import { registerWorkspaceHandlers } from './workspace'
import { registerConceptsHandlers } from './concepts'
import { registerAnalysesHandlers } from './analyses'
import { registerQuizzesHandlers } from './quizzes'
import { registerCheatSheetHandlers } from './cheat-sheet'
import { registerWhatIfHandlers } from './whatif'
import { registerBugHuntHandlers } from './bug-hunt'
import { registerCodeReviewHandlers } from './code-review'
import { registerTestsHandlers } from './tests'
import { registerGitHandlers } from './git-ops'
import { registerRepositoryHandlers } from './repository'
import { registerTelemetryHandlers } from './telemetry'
import { registerAppHandlers } from './app'
import { registerUpdateHandlers } from './updates'
import { registerNotifyHandlers } from './notify'

export function registerIpcHandlers(): void {
  registerAppHandlers()
  registerUpdateHandlers()
  registerNotifyHandlers()
  registerSettingsHandlers()
  registerProviderHandlers()
  registerWorkspaceHandlers()
  registerConceptsHandlers()
  registerAnalysesHandlers()
  registerQuizzesHandlers()
  registerCheatSheetHandlers()
  registerWhatIfHandlers()
  registerBugHuntHandlers()
  registerCodeReviewHandlers()
  registerTestsHandlers()
  registerGitHandlers()
  registerRepositoryHandlers()
  registerTelemetryHandlers()
}
