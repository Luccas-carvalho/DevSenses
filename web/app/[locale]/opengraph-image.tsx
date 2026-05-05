import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({
  params
}: {
  params: { locale: string }
}) {
  const headline = params.locale === 'pt'
    ? 'Você não programa. Você só pede.'
    : "You don't code. You just ask."

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a3a 50%, #0a0a0a 100%)',
          color: '#fafafa',
          fontFamily: 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '999px',
              background: '#6618ed'
            }}
          />
          <span
            style={{
              fontSize: '20px',
              color: '#a1a1aa',
              fontFamily: 'monospace'
            }}
          >
            DevSenses
          </span>
        </div>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: '900px',
            display: 'flex'
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: '40px',
            fontSize: '24px',
            color: '#a1a1aa',
            display: 'flex'
          }}
        >
          {params.locale === 'pt' ? 'Vire dev. Não operador.' : 'Become a dev. Not an operator.'}
        </div>
      </div>
    ),
    { ...size }
  )
}
