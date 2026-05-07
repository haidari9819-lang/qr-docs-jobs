import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const body = await req.json()
    const { titel, stellenart, branche, standort, beschreibung, gehalt_min, gehalt_max, skills, featured, firma_id, preis_typ } = body

    if (!titel || !standort || !beschreibung || !firma_id) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { data, error } = await admin.from('job_listings').insert({
      user_id: user.id,
      firma_id,
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
    return NextResponse.json({ success: true, id: data.id, job: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

