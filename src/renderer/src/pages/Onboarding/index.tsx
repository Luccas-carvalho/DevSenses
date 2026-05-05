import { useOnboarding } from '@/stores/onboarding'
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
      return <Summary />
  }
}
