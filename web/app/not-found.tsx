import Link from 'next/link'

export default function GlobalNotFound() {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0a0a0a', color: '#fafafa' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}
        >
          <h1 style={{ fontSize: '4rem', fontWeight: 700, margin: 0 }}>404</h1>
          <p style={{ color: '#a1a1aa', margin: 0 }}>Page not found.</p>
          <Link href="/" style={{ color: '#6618ed' }}>
            Go home
          </Link>
        </main>
      </body>
    </html>
  )
}
