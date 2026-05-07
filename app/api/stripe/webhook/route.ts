import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook-Signatur fehlt' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Webhook-Signatur ungültig' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const job_id  = session.metadata?.job_id

    if (job_id && session.payment_status === 'paid') {
      const admin = getAdminClient()
      await admin
        .from('job_listings')
        .update({
          featured:       true,
          preis_typ:         'premium',
          stripe_payment_id: session.payment_intent as string,
        })
        .eq('id', job_id)
    }
  }

  return NextResponse.json({ received: true })
}

