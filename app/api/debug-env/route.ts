import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'

// Temporäre Diagnose-Route — nach dem Fix löschen!
// Aufruf: https://jobs.qr-docs.de/api/debug-env
export async function GET() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasUrl        = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey    = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Key prefix prüfen (Service Role Keys beginnen mit "eyJ" und sind lang)
  const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) ?? 'FEHLT'
  const urlValue  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'FEHLT'

  // Direkte DB-Abfrage testen
  let dbResult: { count: number | null; error: string | null } = { count: null, error: null }
  try {
    const admin = getAdminClient()
    const { count, error } = await admin
      .from('job_listings')
      .select('*', { count: 'exact', head: true })
    dbResult = { count: count ?? 0, error: error?.message ?? null }
  } catch (e: any) {
    dbResult = { count: null, error: e.message }
  }

  return NextResponse.json({
    env: {
      SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? `✓ gesetzt (${keyPrefix}...)` : '✗ FEHLT',
      NEXT_PUBLIC_SUPABASE_URL:  hasUrl        ? `✓ ${urlValue}` : '✗ FEHLT',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? '✓ gesetzt' : '✗ FEHLT',
    },
    db: dbResult,
  })
}
