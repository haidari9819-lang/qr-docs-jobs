import { createClient, getAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AusschreibenClient from './AusschreibenClient'

export default async function AusschreibenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/ausschreiben')

  const admin = getAdminClient()
  const { data: profil } = await admin
    .from('firmen_profile')
    .select('id, firmenname, branche, ort, plan')
    .eq('user_id', user.id)
    .maybeSingle()

  return <AusschreibenClient profil={profil} userId={user.id} />
}

