import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Trash2, ChevronDown } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SENIORITY_LABELS, type SeniorityLevel } from '@shared/seniority'
import { cn } from '@/lib/utils'
import Tooltip from '@/components/ui/Tooltip'

const ORDER: SeniorityLevel[] = ['intern', 'junior', 'mid', 'senior']
const MAX_AVATAR_BYTES = 1024 * 1024 // 1MB

export default function Profile() {
  const { value: name, setValue: setName } = useSettings('user_name')
  const { value: avatar, setValue: setAvatar } = useSettings('user_avatar')
  const { value: seniority, setValue: setSeniority } = useSettings('seniority')
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_AVATAR_BYTES) {
      window.alert('Imagem muito grande. Máximo 1MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      window.alert('Selecione um arquivo de imagem.')
      return
    }
    const dataUrl = await resizeImageToDataUrl(file, 256)
    await setAvatar(dataUrl)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function clearAvatar(): Promise<void> {
    await setAvatar('')
  }

  async function refazerCompleto(): Promise<void> {
    const ok = window.confirm(
      'Isso zera todas suas preferências e roda o onboarding desde o início. Continuar?'
    )
    if (!ok) return
    await window.api.invoke('settings:set', { key: 'onboarding_completed', value: false })
    navigate('/onboarding', { replace: true })
  }

  const initial = (name || 'D').slice(0, 1).toUpperCase()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Perfil</h1>

      <div className="flex items-center gap-5 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <Tooltip label="Alterar foto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Camera className="size-3.5 text-muted-foreground" />
            </button>
          </Tooltip>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">{name || 'Sem nome'}</p>
          <p className="text-xs text-muted-foreground mb-2">Avatar opcional, máx 1MB.</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="size-3.5 mr-1" />
              Escolher imagem
            </Button>
            {avatar && (
              <Button type="button" size="sm" variant="ghost" onClick={clearAvatar}>
                <Trash2 className="size-3.5 mr-1" />
                Remover
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <div className="space-y-2 mb-5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-2 mb-8">
        <Label>Senioridade</Label>
        <SeniorityDropdown
          value={seniority as SeniorityLevel}
          onChange={(v) => setSeniority(v)}
        />
      </div>

      <div className="rounded-lg bg-muted/30 px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Quer refazer todo o onboarding (incluindo o quiz)?
        </span>
        <Button size="sm" variant="outline" onClick={refazerCompleto}>
          Refazer onboarding
        </Button>
      </div>
    </div>
  )
}

function SeniorityDropdown({
  value,
  onChange
}: {
  value: SeniorityLevel
  onChange: (v: SeniorityLevel) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-md border border-border bg-card hover:bg-accent transition-colors px-3 h-10 text-sm',
          open && 'border-primary/50 ring-2 ring-primary/20'
        )}
      >
        <span className="font-medium">{SENIORITY_LABELS[value] ?? 'Selecionar'}</span>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform flex-shrink-0',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 z-50 rounded-md border border-border bg-popover shadow-xl overflow-hidden">
          {ORDER.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                onChange(lvl)
                setOpen(false)
              }}
              className={cn(
                'w-full px-3 py-2.5 text-sm text-left hover:bg-accent transition-colors',
                value === lvl && 'bg-primary/10 text-primary font-medium'
              )}
            >
              {SENIORITY_LABELS[lvl]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

async function resizeImageToDataUrl(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas context unavailable'))
          return
        }
        const minSide = Math.min(img.width, img.height)
        const sx = (img.width - minSide) / 2
        const sy = (img.height - minSide) / 2
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => reject(new Error('image load failed'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('file read failed'))
    reader.readAsDataURL(file)
  })
}
