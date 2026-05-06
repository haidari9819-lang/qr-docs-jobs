import { MetadataRoute } from 'next'
import { createClient }  from '@/lib/supabase/server'
import { BRANCHEN_SLUGS, STAEDTE_SLUGS } from '@/lib/seo-data'

const BASE = 'https://jobs.qr-docs.de'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('job_listings')
    .select('id, updated_at')
    .eq('is_active', true)

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                changeFrequency: 'daily',   priority: 1.0, lastModified: new Date() },
    { url: `${BASE}/ausschreiben`, changeFrequency: 'monthly', priority: 0.5, lastModified: new Date() },
    // Stellenart Seiten
    { url: `${BASE}/ausbildung`, changeFrequency: 'daily', priority: 0.8, lastModified: new Date() },
    { url: `${BASE}/praktikum`,  changeFrequency: 'daily', priority: 0.8, lastModified: new Date() },
    { url: `${BASE}/minijob`,    changeFrequency: 'daily', priority: 0.8, lastModified: new Date() },
    { url: `${BASE}/teilzeit`,   changeFrequency: 'daily', priority: 0.8, lastModified: new Date() },
    // Branchen-Seiten
    ...BRANCHEN_SLUGS.map(b => ({
      url:             `${BASE}/jobs/${b}`,
      changeFrequency: 'daily' as const,
      priority:        0.8,
      lastModified:    new Date(),
    })),
    // Stadt × Branche Seiten
    ...BRANCHEN_SLUGS.flatMap(b =>
      STAEDTE_SLUGS.map(s => ({
        url:             `${BASE}/jobs/${b}/${s}`,
        changeFrequency: 'daily' as const,
        priority:        0.6,
        lastModified:    new Date(),
      }))
    ),
  ]

  const jobPages: MetadataRoute.Sitemap = (jobs ?? []).map(j => ({
    url:             `${BASE}/jobs/${j.id}`,
    changeFrequency: 'weekly' as const,
    priority:        0.9,
    lastModified:    new Date(j.updated_at),
  }))

  return [...staticPages, ...jobPages]
}
