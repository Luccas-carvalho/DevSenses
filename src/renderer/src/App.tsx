import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { router } from './routes'

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
