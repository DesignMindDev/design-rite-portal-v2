import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

// Initialize Supabase with service role (bypasses RLS)
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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Tier mapping based on price IDs
const PRICE_TO_TIER: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!]: 'starter',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL!]: 'pro',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!]: 'enterprise'
}

const TIER_TO_DOCUMENTS: Record<string, number> = {
  starter: 10,
  pro: 50,
  enterprise: 999999 // Effectively unlimited
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Check for duplicate events (idempotency)
    const { data: existingEvent } = await supabaseAdmin
      .from('stripe_webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .single()

    if (existingEvent) {
      console.log(`Duplicate event ${event.id} received, ignoring`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Log the event
    const { error: logError } = await supabaseAdmin
      .from('stripe_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        event_data: event.data.object as any,
        processed: false
      })

    if (logError) {
      console.error('Failed to log webhook event:', logError)
      // Continue processing even if logging fails
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await supabaseAdmin
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Handle checkout completion
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const tier = session.metadata?.tier

  if (!userId || !tier) {
    console.error('Missing user_id or tier in checkout session metadata')
    return
  }

  console.log(`Checkout completed for user ${userId}, tier: ${tier}`)

  // Update customer ID if present
  if (session.customer) {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()

    await supabaseAdmin
      .from('subscriptions')
      .update({
        stripe_customer_id: session.customer as string,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (subscription) {
      await supabaseAdmin.rpc('log_subscription_change', {
        p_user_id: userId,
        p_subscription_id: subscription.id,
        p_action: 'checkout_completed',
        p_notes: `Checkout completed for ${tier} tier`
      })
    }
  }

  // Subscription details will be updated via customer.subscription.created event
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  const tier = subscription.metadata?.tier || getTierFromPriceId(subscription.items.data[0]?.price.id)

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Get existing subscription to compare
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, tier, status')
    .eq('user_id', userId)
    .single()

  const status = mapStripeStatus(subscription.status)

  // Update subscription record with new schema
  const updateData: any = {
    tier,
    status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: subscription.items.data[0]?.price.id,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString()
  }

  // Add optional fields if they exist
  if ('current_period_start' in subscription && subscription.current_period_start) {
    updateData.current_period_start = new Date((subscription.current_period_start as number) * 1000).toISOString()
  }
  if ('current_period_end' in subscription && subscription.current_period_end) {
    updateData.current_period_end = new Date((subscription.current_period_end as number) * 1000).toISOString()
  }
  if (subscription.default_payment_method) {
    updateData.default_payment_method = subscription.default_payment_method as string
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to update subscription:', error)
  } else {
    console.log(`Subscription created for user ${userId}: ${tier} tier`)

    // Log to history
    if (existingSub) {
      await supabaseAdmin.rpc('log_subscription_change', {
        p_user_id: userId,
        p_subscription_id: existingSub.id,
        p_action: 'subscription_created',
        p_old_tier: existingSub.tier,
        p_new_tier: tier,
        p_old_status: existingSub.status,
        p_new_status: status,
        p_notes: `Stripe subscription created: ${subscription.id}`
      })
    }
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  const tier = subscription.metadata?.tier || getTierFromPriceId(subscription.items.data[0]?.price.id)

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Get existing subscription to compare
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, tier, status')
    .eq('user_id', userId)
    .single()

  const status = mapStripeStatus(subscription.status)

  // Update subscription record with new schema
  const updateData: any = {
    tier,
    status,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: subscription.items.data[0]?.price.id,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString()
  }

  // Add optional fields if they exist
  if ('current_period_start' in subscription && subscription.current_period_start) {
    updateData.current_period_start = new Date((subscription.current_period_start as number) * 1000).toISOString()
  }
  if ('current_period_end' in subscription && subscription.current_period_end) {
    updateData.current_period_end = new Date((subscription.current_period_end as number) * 1000).toISOString()
  }
  if ('canceled_at' in subscription && subscription.canceled_at) {
    updateData.canceled_at = new Date((subscription.canceled_at as number) * 1000).toISOString()
  }
  if (subscription.default_payment_method) {
    updateData.default_payment_method = subscription.default_payment_method as string
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update(updateData)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to update subscription:', error)
  } else {
    console.log(`Subscription updated for user ${userId}: ${tier} tier, status: ${status}`)

    // Log to history
    if (existingSub) {
      await supabaseAdmin.rpc('log_subscription_change', {
        p_user_id: userId,
        p_subscription_id: existingSub.id,
        p_action: 'subscription_updated',
        p_old_tier: existingSub.tier,
        p_new_tier: tier,
        p_old_status: existingSub.status,
        p_new_status: status,
        p_notes: `Stripe subscription updated: ${subscription.id}`
      })
    }
  }
}

// Handle subscription deletion (cancellation)
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Get existing subscription to compare
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, tier, status')
    .eq('user_id', userId)
    .single()

  // Downgrade to free tier with new schema
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to cancel subscription:', error)
  } else {
    console.log(`Subscription canceled for user ${userId}, downgraded to free tier`)

    // Log to history
    if (existingSub) {
      await supabaseAdmin.rpc('log_subscription_change', {
        p_user_id: userId,
        p_subscription_id: existingSub.id,
        p_action: 'subscription_deleted',
        p_old_tier: existingSub.tier,
        p_new_tier: 'free',
        p_old_status: existingSub.status,
        p_new_status: 'canceled',
        p_notes: `Stripe subscription deleted: ${subscription.id}`
      })
    }
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | undefined

  if (!subscriptionId) return

  // Fetch subscription to get user_id
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Get existing subscription
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, status')
    .eq('user_id', userId)
    .single()

  // Ensure subscription is active
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to update subscription after payment:', error)
  } else {
    console.log(`Payment succeeded for user ${userId}`)

    // Log to history
    if (existingSub) {
      const invoiceAmountFormatted = ((invoice.amount_paid || 0) / 100).toString()
      const invoiceCurrency = (invoice.currency || 'usd').toUpperCase()

      await supabaseAdmin.rpc('log_subscription_change', {
        p_user_id: userId,
        p_subscription_id: existingSub.id,
        p_action: 'payment_succeeded',
        p_old_status: existingSub.status,
        p_new_status: 'active',
        p_notes: `Payment succeeded: ${invoiceAmountFormatted} ${invoiceCurrency} (Invoice: ${invoice.id})`
      })
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | undefined

  if (!subscriptionId) return

  // Fetch subscription to get user_id
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Get existing subscription
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, status')
    .eq('user_id', userId)
    .single()

  // Mark subscription as past_due
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to update subscription after failed payment:', error)
  } else {
    console.log(`Payment failed for user ${userId}, marked as past_due`)

    // Log to history
    if (existingSub) {
      const invoiceAmountFormatted = ((invoice.amount_due || 0) / 100).toString()
      const invoiceCurrency = (invoice.currency || 'usd').toUpperCase()

      await supabaseAdmin.rpc('log_subscription_change', {
        p_user_id: userId,
        p_subscription_id: existingSub.id,
        p_action: 'payment_failed',
        p_old_status: existingSub.status,
        p_new_status: 'past_due',
        p_notes: `Payment failed: ${invoiceAmountFormatted} ${invoiceCurrency} (Invoice: ${invoice.id})`
      })
    }
  }
}

// Helper: Get tier from price ID
function getTierFromPriceId(priceId: string): string {
  return PRICE_TO_TIER[priceId] || 'starter'
}

// Helper: Map Stripe status to our status
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled'
  }

  return statusMap[stripeStatus] || 'active'
}
