import { createClient, getAdminClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import { Metadata }     from 'next'
import JobDetailClient  from './JobDetailClient'
import BranchePageClient from './BranchePageClient'
import { BRANCHEN_SEO } from '@/lib/seo-data'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BASE    = 'https://jobs.qr-docs.de'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const branche = BRANCHEN_SEO[id]
  if (branche) {
    return {
      title:       `${branche.label} Jobs finden | QR-Docs Jobs`,
      description: branche.description,
      alternates:  { canonical: `${BASE}/jobs/${id}` },
    }
  }
  const supabase = getAdminClient()
  const { data: job } = await supabase
    .from('job_listings')
    .select('titel, branche, standort')
    .eq('id', id)
    .single()
  if (!job) return { title: 'Stelle nicht gefunden | QR-Docs Jobs' }
  return {
    title:       `${job.titel} | QR-Docs Jobs`,
    description: `${job.titel} in ${job.standort} – Branche: ${job.branche}. Jetzt bewerben auf QR-Docs Jobs.`,
    alternates:  { canonical: `${BASE}/jobs/${id}` },
  }
}

export default async function JobPage({ params }: Props) {
  const { id } = await params
  const supabase = getAdminClient()

  // ── Branche landing page ──────────────────────────────────────────────────
  const brancheInfo = BRANCHEN_SEO[id]
  if (brancheInfo) {
    const { data: jobs } = await supabase
      .from('job_listings')
      .select('*')
      .eq('aktiv', true)
      .eq('branche', brancheInfo.dbValue)
      .order('featured', { ascending: false })
      .order('created_at',  { ascending: false })
    return <BranchePageClient brancheSlug={id} brancheInfo={brancheInfo} jobs={jobs ?? []} />
  }

  // ── Job detail ────────────────────────────────────────────────────────────
  if (!UUID_RE.test(id)) notFound()

  const { data: job } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: firma } = await supabase
    .from('firmen_profile')
    .select('id, firmenname, branche, ort, plan')
    .eq('id', job.firma_id)
    .single()

  const jobMitFirma = { ...job, firmen_profile: firma ?? null }

  const schema = {
    '@context': 'https://schema.org',
    '@type':    'JobPosting',
    title:       jobMitFirma.titel,
    description: jobMitFirma.beschreibung,
    datePosted:  jobMitFirma.created_at,
    employmentType: jobMitFirma.stellenart,
    jobLocation: {
      '@type':  'Place',
      address:  { '@type': 'PostalAddress', addressLocality: jobMitFirma.standort, addressCountry: 'DE' },
    },
    hiringOrganization: {
      '@type':  'Organization',
      name:     jobMitFirma.firmen_profile?.firmenname ?? '',
      sameAs:   BASE,
    },
    ...(jobMitFirma.gehalt_min ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'EUR',
        value: {
          '@type':    'QuantitativeValue',
          minValue:   jobMitFirma.gehalt_min,
          maxValue:   jobMitFirma.gehalt_max ?? jobMitFirma.gehalt_min,
          unitText:   'MONTH',
        },
      },
    } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <JobDetailClient job={jobMitFirma} />
    </>
  )
}


