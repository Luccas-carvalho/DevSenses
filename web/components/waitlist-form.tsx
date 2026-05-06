'use client'
import { useState, type FormEvent } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Check } from 'lucide-react'

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'success' } | { kind: 'error'; msg: string }

export function WaitlistForm({ ctaLabel, size = 'lg' }: { ctaLabel: string; size?: 'default' | 'lg' }) {
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  const errMsg = (e: string) => locale === 'pt'
    ? e === 'invalid_email' ? 'Email inválido.' : e === 'duplicate' ? 'Já tá na lista.' : 'Tenta de novo.'
    : e === 'invalid_email' ? 'Invalid email.' : e === 'duplicate' ? 'Already on the list.' : 'Try again.'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setState({ kind: 'loading' })
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, locale }) })
      const data = await res.json()
      setState(res.ok ? { kind: 'success' } : { kind: 'error', msg: errMsg(data.error ?? '') })
    } catch { setState({ kind: 'error', msg: errMsg('') }) }
  }

  if (state.kind === 'success') return <div className="flex items-center gap-2 text-primary font-medium"><Check size={18} />{locale === 'pt' ? 'Te avisamos!' : "You're in!"}</div>

  return (
    <div className="relative">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
        <Input type="email" required placeholder={locale === 'pt' ? 'seu@email.com' : 'your@email.com'}
          value={email} onChange={(e) => setEmail(e.target.value)} disabled={state.kind === 'loading'}
          className="flex-1 focus-visible:ring-primary/60 focus-visible:border-primary/50" />
        <Button type="submit" size={size} disabled={state.kind === 'loading'}
          className="shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_32px_-4px_hsl(var(--primary)/0.7)] transition-shadow">
          {state.kind === 'loading' ? <Loader2 className="animate-spin" size={18} /> : ctaLabel}
        </Button>
      </form>
      {state.kind === 'error' && <p className="mt-2 text-sm text-destructive">{state.msg}</p>}
    </div>
  )
}
