import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const form        = await req.formData()
    const job_id      = form.get('job_id') as string
    const name        = form.get('name') as string
    const telefon     = form.get('telefon') as string
    const email       = form.get('email') as string | null
    const anschreiben = form.get('anschreiben') as string | null
    const file        = form.get('lebenslauf') as File | null

    if (!job_id || !name || !telefon) {
      return NextResponse.json({ error: 'Name und Telefon sind Pflichtfelder' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Load job + firma info for email
    const { data: job } = await admin
      .from('job_listings')
      .select('titel, firmen_profile(firmenname, email)')
      .eq('id', job_id)
      .single()

    // Optional: upload CV to Supabase Storage
    let lebenslauf_url: string | null = null
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buf   = Buffer.from(bytes)
      const path  = `bewerbungen/${job_id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await admin.storage
        .from('dokumente')
        .upload(path, buf, { contentType: file.type, upsert: false })
      if (!uploadError) {
        const { data: urlData } = admin.storage.from('dokumente').getPublicUrl(path)
        lebenslauf_url = urlData.publicUrl
      }
    }

    const { error } = await admin.from('job_bewerbungen').insert({
      job_id,
      bewerber_name: name,
      bewerber_telefon: telefon,
      bewerber_email: email || null,
      anschreiben: anschreiben || null,
      lebenslauf_url,
      status: 'neu',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Sync → MilanSQL (fire-and-forget, darf nie die Bewerbung blockieren)
    try {
      const syncUrl = process.env.SYNC_SERVER_URL || 'http://127.0.0.1:8090'
      fetch(`${syncUrl}/sync/bewerbung`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Key': process.env.SYNC_SERVER_KEY || '',
        },
        body: JSON.stringify({ job_id, name, telefon, email, anschreiben, lebenslauf_url }),
      }).catch((e) => console.error('[sync] bewerbung fehlgeschlagen:', e.message))
    } catch (e: any) {
      console.error('[sync] bewerbung error:', e.message)
    }

    // Send email notification to firma
    const firmaEmail = (job?.firmen_profile as any)?.email
    if (firmaEmail && process.env.RESEND_API_KEY) {
      const jobTitel = job?.titel ?? 'Ihrer Stelle'
      const firmaName = (job?.firmen_profile as any)?.firmenname ?? 'Ihr Unternehmen'
      await resend.emails.send({
        from:    'QR-Docs Jobs <jobs@qr-docs.de>',
        to:      firmaEmail,
        subject: `Neue Bewerbung: ${jobTitel} — ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
            <h2 style="color:#111">Neue Bewerbung eingegangen</h2>
            <p style="color:#555">Für die Stelle <strong>${jobTitel}</strong> bei ${firmaName} hat sich jemand beworben.</p>
            <table style="width:100%;border-collapse:collapse;margin:24px 0">
              <tr><td style="padding:8px 0;color:#888;font-size:13px">Name</td><td style="padding:8px 0;color:#111;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#888;font-size:13px">Telefon</td><td style="padding:8px 0;color:#111;font-weight:600">${telefon}</td></tr>
              ${email ? `<tr><td style="padding:8px 0;color:#888;font-size:13px">E-Mail</td><td style="padding:8px 0;color:#111">${email}</td></tr>` : ''}
              ${anschreiben ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;vertical-align:top">Nachricht</td><td style="padding:8px 0;color:#111">${anschreiben}</td></tr>` : ''}
              ${lebenslauf_url ? `<tr><td style="padding:8px 0;color:#888;font-size:13px">Lebenslauf</td><td style="padding:8px 0"><a href="${lebenslauf_url}" style="color:#E05C1A">Download</a></td></tr>` : ''}
            </table>
            <p style="font-size:12px;color:#aaa">Gesendet über QR-Docs Jobs · jobs.qr-docs.de</p>
          </div>
        `,
      }).catch(() => {}) // non-fatal if email fails
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

