// src/app/api/admin/subscriptions/refund/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

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

export async function POST(req: NextRequest) {
  try {
    // Verify admin user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || !['super_admin', 'admin'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, amount, reason } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (!subscription.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const charges = await stripe.charges.list({
      customer: subscription.stripe_customer_id,
      limit: 1,
    })

    if (!charges.data.length) {
      return NextResponse.json({ error: 'No charges found' }, { status: 404 })
    }

    const refund = await stripe.refunds.create({
      charge: charges.data[0].id,
      amount: amount || undefined,
      reason: 'requested_by_customer',
    })

    const refundAmountFormatted = (refund.amount / 100).toString()
    const refundCurrency = refund.currency.toUpperCase()

    await supabaseAdmin.rpc('log_subscription_change', {
      p_user_id: userId,
      p_subscription_id: subscription.id,
      p_action: 'refund_issued',
      p_performed_by: user.id,
      p_notes: reason || `Refund issued: ${refundAmountFormatted} ${refundCurrency}`
    })

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
      },
    })

  } catch (error: any) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to issue refund' },
      { status: 500 }
    )
  }
}
