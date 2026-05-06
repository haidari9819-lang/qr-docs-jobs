import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAdminClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

function getGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY nicht gesetzt')
  return new Groq({ apiKey: key })
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()

    // Load user's firma skills
    const { data: profil } = await admin
      .from('firmen_profile')
      .select('firmenname, branche')
      .eq('user_id', user.id)
      .single()

    const { data: firmaUsers } = await admin
      .from('firmen_users')
      .select('skills')
      .eq('firma_id', profil ? (profil as any).id : '')

    const allSkills = (firmaUsers ?? []).flatMap((u: any) => u.skills ?? [])
    const uniqueSkills = [...new Set(allSkills)]

    // Load active jobs
    const { data: jobs } = await admin
      .from('job_listings')
      .select('id, titel, branche, standort, beschreibung, skills')
      .eq('is_active', true)
      .limit(20)

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Analysiere diese offenen Stellen und finde die 3 besten Matches für eine Firma aus der Branche "${profil?.branche ?? 'Allgemein'}" mit diesen Team-Skills: ${uniqueSkills.join(', ') || 'keine angegeben'}.

Offene Stellen:
${jobs.map(j => `ID: ${j.id} | ${j.titel} | ${j.branche} | Skills: ${(j.skills ?? []).join(', ')}`).join('\n')}

Antworte NUR mit validem JSON (kein Markdown, kein Text davor/danach):
[{"job_id":"...","match_score":85,"grund":"kurze Begründung auf Deutsch"}]`,
      }],
      temperature: 0.3,
      max_tokens: 400,
    })

    const raw = completion.choices[0]?.message?.content ?? '[]'
    let matches = []
    try {
      // Strip potential markdown code blocks
      const clean = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      matches = JSON.parse(clean)
    } catch {
      matches = []
    }

    return NextResponse.json({ matches })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
