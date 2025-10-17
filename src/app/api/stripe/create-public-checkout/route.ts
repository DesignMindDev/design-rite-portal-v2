import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

// PUBLIC ROUTE - No auth required (for new trial signups)
export async function POST(request: NextRequest) {
  try {
    const { email, priceId, tier } = await request.json()

    // Validate required fields
    if (!email || !priceId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: email, priceId, tier' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.log(`[Checkout] Creating session for ${email}, tier: ${tier}`)

    // Create Checkout Session with 7-day trial
    // Note: customer_email instead of customer (user doesn't exist yet)
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/checkout-cancel`,
      metadata: {
        tier: tier,
        source: 'public_trial'
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          tier: tier,
          source: 'public_trial'
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      phone_number_collection: {
        enabled: true
      }
    })

    console.log(`[Checkout] Session created: ${session.id}`)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (error: any) {
    console.error('[Checkout] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
