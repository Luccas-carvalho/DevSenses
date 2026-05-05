import { useEffect, useState } from 'react'
import { Navigate, createHashRouter } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Settings from './pages/Settings'
import Project from './pages/Project'
import Tests from './pages/Tests'
import { useSettings } from './hooks/useSettings'

function FirstLaunchGate(): React.ReactNode {
  const { value: completed, loading } = useSettings('onboarding_completed')
  const [recentPath, setRecentPath] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (loading || !completed) return
    window.api
      .invoke('workspace:recent', undefined)
      .then((rows) => setRecentPath(rows[0]?.path ?? null))
      .catch(() => setRecentPath(null))
  }, [loading, completed])

  if (loading) return null
  if (!completed) return <Navigate to="/onboarding" replace />
  if (recentPath === undefined) return null
  if (recentPath) return <Navigate to={`/project?path=${encodeURIComponent(recentPath)}`} replace />
  return <Navigate to="/home" replace />
}

export const router = createHashRouter([
  { path: '/', element: <FirstLaunchGate /> },
  { path: '/onboarding/*', element: <Onboarding /> },
  { path: '/home', element: <Home /> },
  { path: '/settings', element: <Settings /> },
  { path: '/project', element: <Project /> },
  { path: '/tests', element: <Tests /> }
])
