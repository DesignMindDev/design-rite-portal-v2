// src/app/api/admin/subscriptions/override-tier/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const { userId, tier, notes } = await req.json()

    if (!userId || !tier) {
      return NextResponse.json({ error: 'Missing userId or tier' }, { status: 400 })
    }

    const validTiers = ['free', 'trial', 'starter', 'professional', 'enterprise']
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        tier,
        status: 'active',
      })
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }

    await supabaseAdmin.rpc('log_subscription_change', {
      p_user_id: userId,
      p_subscription_id: subscription.id,
      p_action: 'tier_override',
      p_old_tier: subscription.tier,
      p_new_tier: tier,
      p_performed_by: user.id,
      p_notes: notes || 'Manual tier override by admin'
    })

    return NextResponse.json({ success: true, newTier: tier })

  } catch (error: any) {
    console.error('Override tier error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to override tier' },
      { status: 500 }
    )
  }
}
