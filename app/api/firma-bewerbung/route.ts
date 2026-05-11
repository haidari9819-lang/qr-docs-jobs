import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const form     = await req.formData()
    const firma_id = form.get('firma_id') as string
    const name     = form.get('name')     as string
    const telefon  = form.get('telefon')  as string
    const datei    = form.get('datei')    as File | null

    if (!firma_id || !name || !telefon) {
      return NextResponse.json({ error: 'Name und Telefon sind Pflichtfelder' }, { status: 400 })
    }

    const admin = getAdminClient()

    const { data: firma } = await admin
      .from('firmen_profile')
      .select('firmenname, email')
      .eq('id', firma_id)
      .single()

    // Optional: upload file to Supabase Storage
    let datei_url: string | null = null
    if (datei && datei.size > 0 && datei.size <= 5 * 1024 * 1024) {
      const bytes = await datei.arrayBuffer()
      const buf   = Buffer.from(bytes)
      const path  = `initiativbewerbungen/${firma_id}/${Date.now()}-${datei.name}`
      const { error: uploadError } = await admin.storage
        .from('dokumente')
        .upload(path, buf, { contentType: datei.type, upsert: false })
      if (!uploadError) {
        const { data: urlData } = admin.storage.from('dokumente').getPublicUrl(path)
        datei_url = urlData.publicUrl
      }
    }

    const firmaEmail = firma?.email
    if (firmaEmail && process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from:    'QR-Docs Jobs <jobs@qr-docs.de>',
        to:      firmaEmail,
        subject: `Initiativbewerbung bei ${firma?.firmenname ?? 'Ihrem Unternehmen'} — ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
            <h2 style="color:#111">Neue Initiativbewerbung</h2>
            <p style="color:#555">Jemand hat sich direkt über das Firmenprofil beworben.</p>
            <table style="width:100%;border-collapse:collapse;margin:24px 0">
              <tr><td style="padding:8px 0;color:#888;font-size:13px">Name</td><td style="padding:8px 0;color:#111;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px">Telefon</td><td style="padding:8px 0;color:#111;font-weight:600">${telefon}</td></tr>
              ${datei_url ? `<tr><td style="padding:8px 0;color:#888;font-size:13px">Dokument</td><td style="padding:8px 0"><a href="${datei_url}" style="color:#e8521a">Download</a></td></tr>` : ''}
            </table>
            <p style="font-size:12px;color:#aaa">Gesendet über QR-Docs Jobs · jobs.qr-docs.de</p>
          </div>
        `,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
