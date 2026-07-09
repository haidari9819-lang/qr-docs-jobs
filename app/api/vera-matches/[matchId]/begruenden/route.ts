import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { milansqlQuery } from '@/lib/milansql'

const SYNC_SERVER_URL = process.env.SYNC_SERVER_URL || 'http://127.0.0.1:8090'
const SYNC_SERVER_KEY = process.env.SYNC_SERVER_KEY || ''

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { matchId } = await params
    const mid = parseInt(matchId)
    if (!mid) return NextResponse.json({ error: 'Ungültige Match-ID' }, { status: 400 })

    // Match laden
    const matches = await milansqlQuery(
      "SELECT id, bewerber_id, stelle_id, score, keyword_overlap, provenienz FROM match_objekte WHERE id = ?",
      [mid]
    )
    if (matches.length === 0) {
      return NextResponse.json({ error: 'Match nicht gefunden' }, { status: 404 })
    }
    const match = matches[0]

    // Falls schon begründet, direkt zurückgeben
    if (match.provenienz && (match.provenienz as string).length > 2) {
      return NextResponse.json({
        match_id: mid,
        begruendung: match.provenienz as string,
        cached: true,
      })
    }

    // Bewerber + Stelle laden für Drafter/Reviewer
    const [bewerber, stelle] = await Promise.all([
      milansqlQuery("SELECT skills_text FROM bewerber_profile WHERE id = ?", [match.bewerber_id as number]),
      milansqlQuery("SELECT anforderungen_text FROM stellen_anzeigen WHERE id = ?", [match.stelle_id as number]),
    ])

    if (!bewerber.length || !stelle.length) {
      return NextResponse.json({ error: 'Bewerber oder Stelle nicht gefunden' }, { status: 404 })
    }

    // Drafter/Reviewer über Sync-Server triggern
    const res = await fetch(`${SYNC_SERVER_URL}/begruenden`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Key': SYNC_SERVER_KEY,
      },
      body: JSON.stringify({
        match_id: mid,
        skills_text: bewerber[0].skills_text,
        anforderungen_text: stelle[0].anforderungen_text,
        score: match.score,
        keyword_overlap: match.keyword_overlap,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Sync-Server: ${err}` }, { status: 502 })
    }

    const result = await res.json()
    return NextResponse.json({
      match_id: mid,
      begruendung: result.begruendung || result.provenienz || 'Keine Begründung generiert',
      review_status: result.review_status,
      cached: false,
    })
  } catch (e: any) {
    console.error('[begruenden] error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
