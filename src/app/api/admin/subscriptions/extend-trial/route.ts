// src/app/api/admin/subscriptions/extend-trial/route.ts
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

    // Get request body
    const { userId, days } = await req.json()

    if (!userId || !days) {
      return NextResponse.json(
        { error: 'Missing userId or days' },
        { status: 400 }
      )
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Calculate new trial end date
    const currentTrialEnd = subscription.trial_end 
      ? new Date(subscription.trial_end)
      : new Date()
    
    const newTrialEnd = new Date(currentTrialEnd)
    newTrialEnd.setDate(newTrialEnd.getDate() + days)

    // Update subscription
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        trial_end: newTrialEnd.toISOString(),
        trial_start: subscription.trial_start || new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }

    // Log to history
    await supabaseAdmin.rpc('log_subscription_change', {
      p_user_id: userId,
      p_subscription_id: subscription.id,
      p_action: 'trial_extended',
      p_performed_by: user.id,
      p_notes: `Trial extended by ${days} days`
    })

    return NextResponse.json({
      success: true,
      newTrialEnd: newTrialEnd.toISOString()
    })

  } catch (error: any) {
    console.error('Extend trial error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to extend trial' },
      { status: 500 }
    )
  }
}
