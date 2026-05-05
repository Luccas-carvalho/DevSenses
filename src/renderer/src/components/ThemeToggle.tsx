import { useTheme } from './ThemeProvider'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { ThemeMode } from '@shared/settings'

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'auto', label: 'Sistema', icon: Monitor }
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => {
            setTheme(value)
            window.api.invoke('settings:set', { key: 'theme', value })
          }}
          className="gap-2"
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}
