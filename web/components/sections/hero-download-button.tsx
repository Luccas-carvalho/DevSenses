'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import {
  detectOs,
  OsIcon,
  RELEASES_PAGE,
  onDownloadClick,
  type Os
} from '@/components/icons/os-icon'

const OS_LABEL: Record<Os, string> = {
  macos: 'macOS',
  linux: 'Linux',
  windows: 'Windows'
}

export function HeroDownloadButton() {
  const t = useTranslations('hero')
  const [os, setOs] = useState<Os>('macos')

  useEffect(() => {
    const d = detectOs()
    if (d) setOs(d)
  }, [])

  return (
    <a href={RELEASES_PAGE} onClick={(e) => onDownloadClick(os, e)} className="btn-hero-ghost">
      <OsIcon os={os} size={14} />
      <span>
        {t('cta_download')} {OS_LABEL[os]}
      </span>
      <Download size={13} className="opacity-70" />
    </a>
  )
}
