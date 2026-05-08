import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '@/stores/onboarding'
import CosmicTransition from '@/components/CosmicTransition'
import Welcome from './steps/Welcome'
import Name from './steps/Name'
import ProviderDetect from './steps/ProviderDetect'
import ProviderTest from './steps/ProviderTest'
import ModelSelect from './steps/ModelSelect'
import Seniority from './steps/Seniority'
import Theme from './steps/Theme'
import Workspace from './steps/Workspace'
import Summary from './steps/Summary'

export default function Onboarding() {
  const step = useOnboarding((s) => s.step)
  const draft = useOnboarding((s) => s.draft)
  const reset = useOnboarding((s) => s.reset)
  const navigate = useNavigate()
  const cosmic = useOnboarding((s) => s.cosmic)
  const setCosmic = useOnboarding((s) => s.setCosmic)

  async function finalize(): Promise<void> {
    await window.api.invoke('settings:set', { key: 'user_name', value: draft.user_name! })
    await window.api.invoke('settings:set', { key: 'seniority', value: draft.seniority! })
    await window.api.invoke('settings:set', { key: 'seniority_source', value: draft.seniority_source! })
    await window.api.invoke('settings:set', { key: 'provider_default', value: draft.provider_default! })
    await window.api.invoke('settings:set', { key: 'provider_model', value: draft.provider_model ?? '' })
    await window.api.invoke('settings:set', { key: 'provider_tested', value: draft.provider_tested ?? {} })
    await window.api.invoke('settings:set', { key: 'theme', value: draft.theme! })
    await window.api.invoke('settings:set', { key: 'last_workspace', value: draft.last_workspace ?? null })
    await window.api.invoke('settings:set', { key: 'onboarding_completed', value: true })
    setCosmic(true)
  }

  function handleCosmicDone(): void {
    reset()
    const target = draft.last_workspace
      ? `/project?path=${encodeURIComponent(draft.last_workspace)}`
      : '/home'
    navigate(target, { replace: true })
  }

  if (cosmic) return <CosmicTransition onComplete={handleCosmicDone} />

  switch (step) {
    case 'welcome':
      return <Welcome />
    case 'name':
      return <Name />
    case 'providers':
      return <ProviderDetect />
    case 'test':
      return <ProviderTest />
    case 'model':
      return <ModelSelect />
    case 'seniority':
      return <Seniority />
    case 'theme':
      return <Theme />
    case 'workspace':
      return <Workspace />
    case 'summary':
      return <Summary onFinalize={finalize} />
  }
}
