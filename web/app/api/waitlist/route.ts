import { NextResponse } from 'next/server'
import { addToWaitlist } from '@/lib/waitlist'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { email, locale } = (body ?? {}) as { email?: string; locale?: string }
  if (typeof email !== 'string') {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const result = await addToWaitlist(email.trim().toLowerCase(), locale ?? 'pt')

  if (!result.ok) {
    const status = result.error === 'duplicate' ? 409 : result.error === 'invalid_email' ? 400 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ ok: true })
}
