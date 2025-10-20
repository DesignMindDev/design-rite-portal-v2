import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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

    console.log(`[Portal Checkout] Creating session for ${email}, tier: ${tier}`)

    // ✅ CRITICAL: Create Supabase user BEFORE Stripe checkout
    // This ensures we have a user_id to pass to the webhook
    console.log(`[Portal Checkout] Checking if user exists: ${email}`)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string

    if (existingUser) {
      console.log(`[Portal Checkout] User already exists: ${existingUser.id}`)
      userId = existingUser.id

      // Check if they already have an active subscription
      const { data: existingSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('status, tier')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (existingSubscription) {
        console.log(`[Portal Checkout] User already has active subscription - redirecting`)
        return NextResponse.json(
          { error: 'You already have an active subscription. Please sign in to manage your account.' },
          { status: 400 }
        )
      }
    } else {
      // Create new user in Supabase Auth
      console.log(`[Portal Checkout] Creating new Supabase user: ${email}`)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false, // Don't auto-confirm - they'll set password via invite email
        user_metadata: {
          tier,
          source: 'portal_trial_signup'
        }
      })

      if (createError || !newUser.user) {
        console.error(`[Portal Checkout] Failed to create user:`, createError)
        return NextResponse.json(
          { error: 'Failed to create user account. Please try again.' },
          { status: 500 }
        )
      }

      userId = newUser.user.id
      console.log(`[Portal Checkout] Created new user: ${userId}`)
    }

    console.log(`[Portal Checkout] Using user_id: ${userId} for checkout metadata`)

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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/start-trial?cancelled=true`,
      metadata: {
        user_id: userId, // ✅ CRITICAL: Pass user_id to webhook for invite email
        tier: tier,
        source: 'portal_public_trial',
        email: email
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          user_id: userId, // ✅ CRITICAL: Pass user_id to webhook for invite email
          tier: tier,
          source: 'portal_public_trial'
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
