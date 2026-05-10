import type { MetadataRoute } from 'next'

const BASE = 'https://devsenses.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: `${BASE}/pt`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/en`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/`,  lastModified, changeFrequency: 'weekly', priority: 0.8 },
  ]
}
