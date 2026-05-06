import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JobDetailClient from './JobDetailClient'

interface Props { params: Promise<{ id: string }> }

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('job_listings')
    .select('*, firmen_profile(firmenname, branche, standort, strasse, plz, email, plan)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  return <JobDetailClient job={job} />
}
