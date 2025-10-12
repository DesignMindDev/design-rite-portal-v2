import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

  // Subscription will be updated via customer.subscription.created event
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  const tier = subscription.metadata?.tier || getTierFromPriceId(subscription.items.data[0]?.price.id)

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  const maxDocuments = TIER_TO_DOCUMENTS[tier] || 10

  // Update subscription record
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier,
      status: 'active',
      max_documents: maxDocuments,
      source: 'stripe',
      is_trial: false,
      trial_start: null,
      trial_end: null,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to update subscription:', error)
  } else {
    console.log(`Subscription created for user ${userId}: ${tier} tier`)
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

  const maxDocuments = TIER_TO_DOCUMENTS[tier] || 10
  const status = mapStripeStatus(subscription.status)

  // Update subscription record
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier,
      status,
      max_documents: maxDocuments,
      stripe_price_id: subscription.items.data[0]?.price.id,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to update subscription:', error)
  } else {
    console.log(`Subscription updated for user ${userId}: ${tier} tier, status: ${status}`)
  }
}

// Handle subscription deletion (cancellation)
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Downgrade to free tier
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      max_documents: 2,
      source: 'free',
      is_trial: false,
      stripe_subscription_id: null,
      stripe_price_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to cancel subscription:', error)
  } else {
    console.log(`Subscription canceled for user ${userId}, downgraded to free tier`)
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

  // Ensure subscription is active
  const { error } = await supabase
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

  // Mark subscription as past_due
  const { error } = await supabase
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
