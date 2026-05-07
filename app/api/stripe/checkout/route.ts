import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    const { job_id, plan } = await req.json()

    if (!job_id || plan !== 'premium') {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
    }

    const priceId = process.env.STRIPE_PRICE_PREMIUM
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 500 })
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://jobs.qr-docs.de'

    const session = await stripe.checkout.sessions.create({
      mode:        'payment',
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: `${base}/ausschreiben/success?job_id=${job_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${base}/ausschreiben`,
      metadata:    { job_id, plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

