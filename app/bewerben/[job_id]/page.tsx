import { getAdminClient } from '@/lib/supabase/server'
import { notFound }     from 'next/navigation'
import { Metadata }     from 'next'
import BewerbenClient   from './BewerbenClient'

interface Props { params: Promise<{ job_id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { job_id } = await params
  const supabase   = getAdminClient()
  const { data: job } = await supabase
    .from('job_listings')
    .select('titel, firmen_profile(firmenname)')
    .eq('id', job_id)
    .single()

  if (!job) return { title: 'Stelle nicht gefunden' }
  const firma = (job.firmen_profile as any)?.firmenname ?? ''
  return {
    title: `${job.titel} bei ${firma} — Jetzt bewerben`,
    robots: { index: false },
  }
}

export default async function BewerbenPage({ params }: Props) {
  const { job_id } = await params
  const supabase   = getAdminClient()

  const { data: job } = await supabase
    .from('job_listings')
    .select('id, titel, standort, stellenart, branche, firmen_profile(firmenname)')
    .eq('id', job_id)
    .eq('is_active', true)
    .single()

  if (!job) notFound()

  return <BewerbenClient job={job as any} />
}
