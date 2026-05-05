import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // web/ was scaffolded with --no-eslint; linting is handled at Electron root
    ignoreDuringBuilds: true
  },
  typescript: {
    // type errors surface in editor via tsconfig; build remains fast
    ignoreBuildErrors: false
  }
}

export default withNextIntl(nextConfig)
