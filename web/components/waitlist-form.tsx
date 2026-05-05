'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Check } from 'lucide-react'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

type Props = {
  ctaLabel: string
  size?: 'default' | 'lg'
}

export function WaitlistForm({ ctaLabel, size = 'lg' }: Props) {
  const locale = useLocale()
  const t = useTranslations()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  const errorLabel = (err: string): string => {
    if (locale === 'pt') {
      if (err === 'invalid_email') return 'Email inválido.'
      if (err === 'duplicate') return 'Já tá na lista.'
      return 'Tenta de novo.'
    }
    if (err === 'invalid_email') return 'Invalid email.'
    if (err === 'duplicate') return 'Already on the list.'
    return 'Try again.'
  }

  const successLabel = locale === 'pt' ? 'Te avisamos!' : "You're in!"

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setState({ kind: 'loading' })

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale })
      })
      const data = await res.json()

      if (!res.ok) {
        setState({ kind: 'error', message: errorLabel(data.error ?? 'unknown') })
        return
      }
      setState({ kind: 'success' })
    } catch {
      setState({ kind: 'error', message: errorLabel('network') })
    }
  }

  if (state.kind === 'success') {
    return (
      <div className="flex items-center gap-2 text-primary font-medium">
        <Check size={20} />
        {successLabel}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <Input
        type="email"
        required
        placeholder={locale === 'pt' ? 'seu@email.com' : 'your@email.com'}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={state.kind === 'loading'}
        className="flex-1"
      />
      <Button type="submit" size={size} disabled={state.kind === 'loading'}>
        {state.kind === 'loading' ? <Loader2 className="animate-spin" size={18} /> : ctaLabel}
      </Button>
      {state.kind === 'error' && (
        <p className="absolute mt-12 text-sm text-red-500" role="alert">
          {state.message}
        </p>
      )}
    </form>
  )
}
