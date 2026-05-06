import { createClient } from '@/lib/supabase/server'
import JobSearchClient from './JobSearchClient'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('job_listings')
    .select('*, firmen_profile(firmenname, branche, standort, plan)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const [{ count: jobCount }, { count: firmaCount }, { count: ausbildungCount }] = await Promise.all([
    supabase.from('job_listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('job_listings').select('firma_id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('job_listings').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('stellenart', 'Ausbildung'),
  ])

  return (
    <JobSearchClient
      initialJobs={jobs ?? []}
      stats={{ jobs: jobCount ?? 0, firmen: firmaCount ?? 0, ausbildung: ausbildungCount ?? 0 }}
    />
  )
}
