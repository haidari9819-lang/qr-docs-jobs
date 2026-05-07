import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase magic link / OAuth callbacks
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code     = searchParams.get('code')
  const next     = searchParams.get('next') ?? '/ausschreiben'
  const redirect = searchParams.get('redirect') ?? next

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect to intended page after successful auth
      const target = redirect.startsWith('/') ? `${origin}${redirect}` : redirect
      return NextResponse.redirect(target)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

