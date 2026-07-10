import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

function signToken(firmaId: string, ts: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SYNC_SERVER_KEY || 'fallback'
  const payload = `${firmaId}:${ts}`
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

// POST /api/verify-firma — sends verification email
export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

    const admin = getAdminClient()
    const { data: profil } = await admin
      .from('firmen_profile')
      .select('id, firmenname, email')
      .eq('user_id', user.id)
      .single()

    if (!profil?.email) {
      return NextResponse.json({ error: 'Keine Firmen-E-Mail hinterlegt' }, { status: 400 })
    }

    const ts    = Date.now()
    const token = signToken(profil.id, ts)
    const base  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://jobs.qr-docs.de'

    await resend.emails.send({
      from:    'QR-Docs <noreply@qr-docs.de>',
      to:      profil.email,
      subject: 'E-Mail-Adresse bestätigen — QR-Docs Jobs',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#111">Firmen-Verifizierung</h2>
          <p style="color:#555">Klicke auf den Button um <strong>${profil.firmenname}</strong> zu verifizieren und das grüne "✓ QR-Docs verifiziert" Badge zu erhalten.</p>
          <a href="${base}/api/verify-firma/confirm?token=${token}&firma_id=${profil.id}"
             style="display:inline-block;margin:24px 0;padding:12px 24px;background:#22c55e;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px">
            ✓ E-Mail bestätigen
          </a>
          <p style="font-size:12px;color:#aaa">Link gültig für 24 Stunden.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

