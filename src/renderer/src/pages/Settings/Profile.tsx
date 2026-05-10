import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Trash2, ChevronDown, RotateCcw, AlertTriangle, Sprout, Rocket, Zap, Flame } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SENIORITY_LABELS, type SeniorityLevel } from '@shared/seniority'
import { cn } from '@/lib/utils'
import Tooltip from '@/components/ui/Tooltip'

const ORDER: SeniorityLevel[] = ['intern', 'junior', 'mid', 'senior']
const MAX_AVATAR_BYTES = 1024 * 1024 // 1MB

const SENIORITY_META: Record<SeniorityLevel, { icon: React.ReactElement; desc: string }> = {
  intern:  { icon: <Sprout className="size-4" />, desc: 'Estágio' },
  junior:  { icon: <Rocket className="size-4" />, desc: 'Júnior' },
  mid:     { icon: <Zap className="size-4" />, desc: 'Pleno' },
  senior:  { icon: <Flame className="size-4" />, desc: 'Sênior' }
}

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
  const currentSeniority = seniority as SeniorityLevel

  return (
    <div className="w-full ds-fade-up">

      {/* ── Avatar hero card ── */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm mb-5 p-5 flex items-center gap-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-transparent">
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
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center hover:bg-accent transition-colors shadow-sm"
            >
              <Camera className="size-3.5 text-muted-foreground" />
            </button>
          </Tooltip>
        </div>

        {/* Name + seniority info */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold truncate">{name || 'Sem nome'}</p>
          {currentSeniority && (
            <div className="flex items-center gap-1.5 mt-1 mb-3">
              <span className="rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-[11px] text-primary font-medium inline-flex items-center gap-1">
                {SENIORITY_META[currentSeniority]?.icon} {SENIORITY_LABELS[currentSeniority]}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="size-3.5 mr-1.5" />
              Trocar foto
            </Button>
            {avatar && (
              <Button type="button" size="sm" variant="ghost" onClick={clearAvatar}>
                <Trash2 className="size-3.5 mr-1.5" />
                Remover
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">Avatar opcional · máx 1 MB</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* ── Nome ── */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">N</span>
          </div>
          <div>
            <p className="text-sm font-medium">Identificação</p>
            <p className="text-[11px] text-muted-foreground">Como a IA vai te chamar</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome..."
          />
        </div>
      </div>

      {/* ── Seniority selector ── */}
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Zap className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Senioridade</p>
            <p className="text-[11px] text-muted-foreground">A IA adapta as explicações ao seu nível</p>
          </div>
        </div>

        {/* Visual 4-card seniority picker */}
        <div className="grid grid-cols-4 gap-2">
          {ORDER.map((lvl) => {
            const isSelected = currentSeniority === lvl
            const meta = SENIORITY_META[lvl]
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSeniority(lvl)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border transition-all text-center',
                  isSelected
                    ? 'border-primary/60 bg-primary/10 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]'
                    : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40'
                )}
              >
                <span className={cn('transition-colors', isSelected ? 'text-primary' : 'text-muted-foreground')}>{meta.icon}</span>
                <span
                  className={cn(
                    'text-[11px] font-medium leading-tight',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {meta.desc}
                </span>
              </button>
            )
          })}
        </div>

        {/* Hidden dropdown kept for logic compatibility */}
        <div className="sr-only">
          <SeniorityDropdown
            value={currentSeniority}
            onChange={(v) => setSeniority(v)}
          />
        </div>
      </div>

      {/* ── Zona de reset ── */}
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 backdrop-blur-sm p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="size-4 text-destructive/70" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Zona de reset</p>
            <p className="text-[11px] text-muted-foreground">
              Refaz o onboarding completo (quiz + preferências)
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={refazerCompleto} className="flex-shrink-0 border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 text-destructive/80 hover:text-destructive">
          <RotateCcw className="size-3.5 mr-1.5" />
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
