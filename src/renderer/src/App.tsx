import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import CodeThemeApplicator from './components/CodeThemeApplicator'
import { router } from './routes'

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <CodeThemeApplicator />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
