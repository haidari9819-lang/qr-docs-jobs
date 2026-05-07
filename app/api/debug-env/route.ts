import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const admin = getAdminClient()

  // Eine Zeile holen um die echten Spaltennamen zu sehen
  const { data: sample, error: e1 } = await admin
    .from('job_listings')
    .select('*')
    .limit(1)

  const columns = sample?.[0] ? Object.keys(sample[0]) : []

  // Mit 'aktiv' testen (User-Angabe)
  const { count: countAktiv, error: e2 } = await admin
    .from('job_listings')
    .select('*', { count: 'exact', head: true })
    .eq('aktiv', true)

  // Mit Join testen
  const { data: withJoin, error: e3 } = await admin
    .from('job_listings')
    .select('id, titel, firmen_profile(firmenname)')
    .eq('aktiv', true)
    .limit(2)

  return NextResponse.json({
    columns,
    countAktiv:  { count: countAktiv, error: e2?.message },
    withJoin:    { data: withJoin,    error: e3?.message },
    rawSample:   sample?.[0] ?? null,
  })
}
