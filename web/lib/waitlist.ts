const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function isValidEmail(e: string) { return EMAIL_RE.test(e) && e.length <= 254 }
export type WaitlistResult = { ok: true } | { ok: false; error: 'invalid_email' | 'duplicate' | 'provider_error' }
export async function addToWaitlist(email: string): Promise<WaitlistResult> {
  if (!isValidEmail(email)) return { ok: false, error: 'invalid_email' }
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!apiKey || !audienceId) { console.warn('[waitlist] no env — dev no-op'); return { ok: true } }
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false })
    })
    if (res.status === 409) return { ok: false, error: 'duplicate' }
    if (!res.ok) return { ok: false, error: 'provider_error' }
    return { ok: true }
  } catch { return { ok: false, error: 'provider_error' } }
}
