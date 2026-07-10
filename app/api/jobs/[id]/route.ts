import { NextRequest, NextResponse } from 'next/server'
import { createClient, getAdminClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

async function verifyOwnership(user: { id: string }, jobId: string) {
  const admin = getAdminClient()
  const { data: profil } = await admin
    .from('firmen_profile')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!profil) return null

  const { data: job } = await admin
    .from('job_listings')
    .select('id, firma_id')
    .eq('id', jobId)
    .maybeSingle()
  if (!job || job.firma_id !== profil.id) return null

  return profil
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await verifyOwnership(user, id)
  if (!owner) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  const body = await req.json()
  const admin = getAdminClient()
  const { error } = await admin.from('job_listings').update(body).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = await verifyOwnership(user, id)
  if (!owner) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  const admin = getAdminClient()
  const { error } = await admin.from('job_listings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

