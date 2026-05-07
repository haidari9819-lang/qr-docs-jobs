import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const admin = getAdminClient()

  // Query 1: count ohne Join (wie vorher — lieferte 8)
  const { count: countSimple, error: e1 } = await admin
    .from('job_listings')
    .select('*', { count: 'exact', head: true })

  // Query 2: is_active filter
  const { count: countActive, error: e2 } = await admin
    .from('job_listings')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Query 3: exakt wie homepage — MIT Join
  const { data: jobsWithJoin, error: e3 } = await admin
    .from('job_listings')
    .select('id, titel, is_active, firma_id, firmen_profile(firmenname)')
    .eq('is_active', true)
    .limit(3)

  // Query 4: alle Spalten ohne Join
  const { data: jobsRaw, error: e4 } = await admin
    .from('job_listings')
    .select('id, titel, is_active, firma_id')
    .limit(3)

  // Query 5: firmen_profile Tabelle erreichbar?
  const { count: firmaCount, error: e5 } = await admin
    .from('firmen_profile')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    countAll:     { count: countSimple, error: e1?.message },
    countActive:  { count: countActive, error: e2?.message },
    jobsWithJoin: { data: jobsWithJoin, error: e3?.message },
    jobsRaw:      { data: jobsRaw,      error: e4?.message },
    firmaCount:   { count: firmaCount,  error: e5?.message },
  })
}
