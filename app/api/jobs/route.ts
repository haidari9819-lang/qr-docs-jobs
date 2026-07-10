import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const body = await req.json()
    const { titel, stellenart, branche, standort, beschreibung, gehalt_min, gehalt_max, skills, featured, preis_typ } = body

    if (!titel || !standort || !beschreibung) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
    }

    const admin = getAdminClient()

    // firma_id aus Session ableiten, NICHT aus dem Request-Body vertrauen
    const { data: profil } = await admin
      .from('firmen_profile')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profil) {
      return NextResponse.json({ error: 'Kein Firmenprofil gefunden' }, { status: 403 })
    }

    const { data, error } = await admin.from('job_listings').insert({
      firma_id: profil.id,
      titel,
      stellenart:  stellenart  ?? 'Vollzeit',
      branche:     branche     ?? '',
      standort,
      beschreibung,
      gehalt_min:  gehalt_min  ?? null,
      gehalt_max:  gehalt_max  ?? null,
      skills:      skills      ?? [],
      featured: featured ?? false,
      preis_typ:   preis_typ   ?? 'kostenlos',
      aktiv:   true,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Sync → MilanSQL (fire-and-forget, darf nie die Stellenanzeige blockieren)
    try {
      const syncUrl = process.env.SYNC_SERVER_URL || 'http://127.0.0.1:8090'
      fetch(`${syncUrl}/sync/stelle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Key': process.env.SYNC_SERVER_KEY || '',
        },
        body: JSON.stringify({
          job_id: data.id,
          titel,
          beschreibung,
          skills,
          branche,
          standort,
          user_id: user.id,
        }),
      }).catch((e) => console.error('[sync] stelle fehlgeschlagen:', e.message))
    } catch (e: any) {
      console.error('[sync] stelle error:', e.message)
    }

    return NextResponse.json({ success: true, id: data.id, job: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

