import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { milansqlQuery } from '@/lib/milansql'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stelleId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { stelleId } = await params

    // Stelle in MilanSQL finden (über supabase_job_id oder titel)
    const stellen = await milansqlQuery(
      "SELECT id FROM stellen_anzeigen WHERE id = ? OR titel LIKE ?",
      [parseInt(stelleId) || 0, `%${stelleId}%`]
    )

    if (stellen.length === 0) {
      return NextResponse.json({ matches: [], total: 0 })
    }

    const milansqlStelleId = stellen[0].id as number

    // Top 5 Matches laden, nach Score absteigend
    const matches = await milansqlQuery(
      "SELECT id, bewerber_id, score, keyword_overlap, review_status, provenienz, created_at FROM match_objekte WHERE stelle_id = ? ORDER BY score DESC",
      [milansqlStelleId]
    )

    // Bewerber-Namen nachladen
    const enriched = []
    for (const match of matches.slice(0, 5)) {
      let bewerberName = 'Unbekannt'
      try {
        const bewerber = await milansqlQuery(
          "SELECT name FROM bewerber_profile WHERE id = ?",
          [match.bewerber_id as number]
        )
        if (bewerber.length > 0) bewerberName = bewerber[0].name as string
      } catch { /* ignore */ }

      enriched.push({
        match_id: match.id,
        bewerber_id: match.bewerber_id,
        bewerber_name: bewerberName,
        score: (match.score as number) / 10000, // zurück zu 0-1 Float
        score_pct: Math.round((match.score as number) / 100), // z.B. 45 = 45%
        keyword_overlap: JSON.parse((match.keyword_overlap as string) || '[]'),
        review_status: match.review_status,
        has_begruendung: !!(match.provenienz && (match.provenienz as string).length > 2),
        created_at: match.created_at,
      })
    }

    return NextResponse.json({
      stelle_id: milansqlStelleId,
      matches: enriched,
      total: matches.length,
    })
  } catch (e: any) {
    console.error('[vera-matches] error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
