import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const job_id     = form.get('job_id') as string
    const name       = form.get('name') as string
    const email      = form.get('email') as string
    const telefon    = form.get('telefon') as string | null
    const anschreiben= form.get('anschreiben') as string | null
    const file       = form.get('lebenslauf') as File | null

    if (!job_id || !name || !email) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Optional: upload Lebenslauf to Supabase Storage
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
      job_id, name, email,
      telefon: telefon || null,
      anschreiben: anschreiben || null,
      lebenslauf_url,
      status: 'neu',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
