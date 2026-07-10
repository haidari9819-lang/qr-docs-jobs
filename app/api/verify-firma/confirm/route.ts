import { NextRequest } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

function verifyToken(token: string, firmaId: string): boolean {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SYNC_SERVER_KEY || 'fallback'
  const decoded = Buffer.from(token, 'base64url').toString()
  const parts = decoded.split(':')
  if (parts.length !== 3) return false

  const [id, ts, sig] = parts
  if (id !== firmaId) return false

  const age = Date.now() - Number(ts)
  if (age > 24 * 60 * 60 * 1000) return false

  const expected = createHmac('sha256', secret).update(`${id}:${ts}`).digest('base64url')
  return sig === expected
}

export async function GET(req: NextRequest) {
  const firma_id = req.nextUrl.searchParams.get('firma_id')
  const token    = req.nextUrl.searchParams.get('token')
  const base     = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://jobs.qr-docs.de'

  const fail = (msg: string) =>
    new Response(
      `<html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>❌ ${msg}</h2><p>Bitte fordere einen neuen Bestätigungslink an.</p>
        <a href="${base}/dashboard/jobs" style="color:#E05C1A">Zum Dashboard</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 400 }
    )

  if (!firma_id || !token) return fail('Ungültiger Link')

  if (!verifyToken(token, firma_id)) return fail('Link ungültig oder abgelaufen')

  try {
    const admin = getAdminClient()
    await admin.from('firmen_profile').update({ verified: true }).eq('id', firma_id)

    return Response.redirect(`${base}/dashboard/jobs?verified=1`)
  } catch {
    return fail('Fehler bei der Verifizierung')
  }
}

