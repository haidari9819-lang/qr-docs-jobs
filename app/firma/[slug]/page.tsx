import { getAdminClient } from '@/lib/supabase/server'
import { notFound }       from 'next/navigation'
import { Metadata }       from 'next'
import { toSlug }         from '@/lib/helpers'
import FirmaProfilClient  from './FirmaProfilClient'

const BASE = 'https://jobs.qr-docs.de'

interface Props { params: Promise<{ slug: string }> }

async function getFirmaBySlug(slug: string) {
  const supabase = getAdminClient()
  const { data: firmen } = await supabase
    .from('firmen_profile')
    .select('id, firmenname, branche, ort, plan, verified, email')

  return (firmen ?? []).find(f => toSlug(f.firmenname ?? '') === slug) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const firma = await getFirmaBySlug(slug)
  if (!firma) return { title: 'Firma nicht gefunden | QR-Docs Jobs' }
  return {
    title:       `${firma.firmenname} – Jobs & Karriere | QR-Docs Jobs`,
    description: `Alle offenen Stellen bei ${firma.firmenname} (${firma.branche ?? 'KMU'}) in ${firma.ort ?? 'Deutschland'}. Jetzt in 30 Sekunden bewerben.`,
    alternates:  { canonical: `${BASE}/firma/${slug}` },
  }
}

export default async function FirmaProfilPage({ params }: Props) {
  const { slug } = await params
  const firma = await getFirmaBySlug(slug)
  if (!firma) notFound()

  const supabase = getAdminClient()
  const { data: jobs } = await supabase
    .from('job_listings')
    .select('id, titel, stellenart, branche, standort, beschreibung, gehalt_min, gehalt_max, skills, featured, created_at, firma_id')
    .eq('firma_id', firma.id)
    .eq('aktiv', true)
    .order('featured', { ascending: false })
    .order('created_at',  { ascending: false })

  return (
    <FirmaProfilClient
      firma={{ ...firma, slug }}
      jobs={jobs ?? []}
    />
  )
}
