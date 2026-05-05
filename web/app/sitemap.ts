import type { MetadataRoute } from 'next'

const BASE_URL = 'https://devsenses.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/en`, lastModified, changeFrequency: 'weekly', priority: 0.9 }
  ]
}
