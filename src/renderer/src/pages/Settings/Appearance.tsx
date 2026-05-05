import { useSettings } from '@/hooks/useSettings'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@shared/settings'

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'auto', label: 'Sistema', icon: Monitor },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'light', label: 'Claro', icon: Sun }
]

export default function Appearance() {
  const { value, setValue } = useSettings('theme')
  const { setTheme } = useTheme()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Aparência</h1>

      <div className="grid gap-2">
        {OPTIONS.map(({ value: opt, label, icon: Icon }) => (
          <button
            key={opt}
            onClick={() => {
              setValue(opt)
              setTheme(opt)
            }}
            className={cn(
              'flex items-center gap-3 text-left rounded-xl border bg-card p-4 transition',
              value === opt ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:bg-accent'
            )}
          >
            <Icon className="size-5 text-primary" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
