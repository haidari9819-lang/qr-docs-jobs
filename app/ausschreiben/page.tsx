import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AusschreibenClient from './AusschreibenClient'

export default async function AusschreibenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`https://www.qr-docs.de/auth/login?redirect=${encodeURIComponent('https://jobs.qr-docs.de/ausschreiben')}`)

  const { data: profil } = await supabase
    .from('firmen_profile')
    .select('id, firmenname, branche, standort, plan')
    .eq('user_id', user.id)
    .maybeSingle()

  return <AusschreibenClient profil={profil} userId={user.id} />
}
