import { MetadataRoute } from 'next'
import { BRANCHEN_SLUGS, STAEDTE_SLUGS } from '@/lib/seo-data'

const BASE = 'https://jobs.qr-docs.de'

// Static sitemap — no DB dependency so it never fails with 500.
// Individual job-listing URLs are served via canonical <link> tags on each page.
export default function sitemap(): MetadataRoute.Sitemap {
  const branchen = BRANCHEN_SLUGS
  const staedte  = STAEDTE_SLUGS
  const arten    = ['ausbildung', 'praktikum', 'minijob', 'teilzeit']

  return [
    // ── Homepage ──────────────────────────────────────────────────────────
    { url: BASE,                  changeFrequency: 'daily',   priority: 1.0 },

    // ── Stellenart-Seiten ─────────────────────────────────────────────────
    ...arten.map(a => ({
      url:             `${BASE}/${a}`,
      changeFrequency: 'daily' as const,
      priority:        0.8,
    })),

    // ── Branchen-Seiten ───────────────────────────────────────────────────
    ...branchen.map(b => ({
      url:             `${BASE}/jobs/${b}`,
      changeFrequency: 'daily' as const,
      priority:        0.8,
    })),

    // ── Stadt × Branche-Seiten ────────────────────────────────────────────
    ...branchen.flatMap(b =>
      staedte.map(s => ({
        url:             `${BASE}/jobs/${b}/${s}`,
        changeFrequency: 'weekly' as const,
        priority:        0.6,
      }))
    ),

    // ── Sonstige ──────────────────────────────────────────────────────────
    { url: `${BASE}/ausschreiben`, changeFrequency: 'monthly', priority: 0.5 },
  ]
}

