import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobsDashboardClient from './JobsDashboardClient'

export default async function JobsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`https://www.qr-docs.de/auth/login?redirect=${encodeURIComponent('https://jobs.qr-docs.de/dashboard/jobs')}`)

  const { data: profil } = await supabase
    .from('firmen_profile')
    .select('id, firmenname, plan')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profil) redirect('https://www.qr-docs.de/dashboard')

  // Fetch this firma's jobs with application counts
  const { data: jobs } = await supabase
    .from('job_listings')
    .select('*')
    .eq('firma_id', profil.id)
    .order('created_at', { ascending: false })

  // Fetch all applications for these jobs
  const jobIds = (jobs ?? []).map(j => j.id)
  const { data: bewerbungen } = jobIds.length > 0
    ? await supabase.from('job_bewerbungen').select('*').in('job_id', jobIds)
    : { data: [] }

  return <JobsDashboardClient profil={profil} jobs={jobs ?? []} bewerbungen={bewerbungen ?? []} />
}
