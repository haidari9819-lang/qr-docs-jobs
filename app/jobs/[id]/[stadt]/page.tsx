import { createClient }    from '@/lib/supabase/server'
import { notFound }        from 'next/navigation'
import { Metadata }        from 'next'
import BranchePageClient   from '../BranchePageClient'
import { BRANCHEN_SEO, STAEDTE } from '@/lib/seo-data'

const BASE = 'https://jobs.qr-docs.de'

interface Props { params: Promise<{ id: string; stadt: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, stadt } = await params
  const branche    = BRANCHEN_SEO[id]
  const stadtLabel = STAEDTE[stadt]
  if (!branche || !stadtLabel) return { title: 'Jobs | QR-Docs Jobs' }
  return {
    title:       `${branche.label} Jobs ${stadtLabel} | QR-Docs Jobs`,
    description: `${branche.label} Jobs in ${stadtLabel}: Verifizierte Stellen bei KMU. Jetzt bewerben auf QR-Docs Jobs.`,
    alternates:  { canonical: `${BASE}/jobs/${id}/${stadt}` },
  }
}

export default async function StadtBranchePage({ params }: Props) {
  const { id, stadt } = await params
  const brancheInfo = BRANCHEN_SEO[id]
  const stadtLabel  = STAEDTE[stadt]
  if (!brancheInfo || !stadtLabel) notFound()

  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('job_listings')
    .select('*, firmen_profile(firmenname, branche, standort, plan)')
    .eq('is_active', true)
    .eq('branche', brancheInfo.dbValue)
    .ilike('standort', `%${stadtLabel}%`)
    .order('is_featured', { ascending: false })
    .order('created_at',  { ascending: false })

  const schema = {
    '@context':   'https://schema.org',
    '@type':      'LocalBusiness',
    name:         `QR-Docs Jobs — ${brancheInfo.label} in ${stadtLabel}`,
    description:  `${brancheInfo.label} Jobs in ${stadtLabel}: Verifizierte Stellen bei KMU`,
    url:          BASE,
    address:      { '@type': 'PostalAddress', addressLocality: stadtLabel, addressCountry: 'DE' },
    areaServed:   stadtLabel,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BranchePageClient
        brancheSlug={id}
        brancheInfo={brancheInfo}
        jobs={jobs ?? []}
        stadtSlug={stadt}
        stadtLabel={stadtLabel}
      />
    </>
  )
}
