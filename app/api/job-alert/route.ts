import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { email, region, branche, stellenart } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Gültige E-Mail erforderlich' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Check for duplicate
    const { data: existing } = await admin
      .from('job_alerts')
      .select('id')
      .eq('email', email)
      .eq('region', region ?? '')
      .eq('branche', branche ?? '')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, duplicate: true })
    }

    const { error } = await admin.from('job_alerts').insert({
      email,
      region:     region     || null,
      branche:    branche    || null,
      stellenart: stellenart || null,
      bestaetigt: false,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Confirmation email
    if (process.env.RESEND_API_KEY) {
      const filterText = [branche, region].filter(Boolean).join(' · ') || 'alle Stellen'
      await resend.emails.send({
        from:    'QR-Docs Jobs <jobs@qr-docs.de>',
        to:      email,
        subject: 'Job-Alert aktiviert ✓',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#111">Job-Alert aktiviert!</h2>
            <p style="color:#555">Du wirst benachrichtigt sobald neue Stellen für <strong>${filterText}</strong> verfügbar sind.</p>
            <p style="font-size:12px;color:#aaa">QR-Docs Jobs · jobs.qr-docs.de</p>
          </div>
        `,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
