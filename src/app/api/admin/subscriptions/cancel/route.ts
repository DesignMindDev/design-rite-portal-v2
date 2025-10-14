/**
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
 * Admin API: Cancel Subscription
 * Allows admins to manually cancel a customer's subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { requireRole, logAdminAction } from '@/lib/supabase-admin-auth';

// Lazy initialization to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function POST(req: NextRequest) {
  // Check admin authentication
  const admin = await requireRole(['super_admin', 'admin']);
  if (admin instanceof NextResponse) return admin; // Return error if not authorized

  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const { subscription_id, reason } = await req.json();

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'Missing subscription_id' },
        { status: 400 }
      );
    }

    // Get subscription from database
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription_id)
      .single();

    if (subError || !sub) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Cancel in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscription_id);

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);

    // Update user profile
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
      })
      .eq('id', sub.user_id);

    // Log history
    await supabase
      .from('subscription_history')
      .insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        action: 'cancelled',
        old_status: sub.status,
        new_status: 'cancelled',
        reason: reason || 'Admin cancellation',
        is_automatic: false,
      });

    // Log admin action
    await logAdminAction({
      userId: admin.id,
      action: 'subscription_cancelled',
      details: {
        subscription_id,
        customer_id: sub.user_id,
        reason: reason || 'Admin cancellation',
      },
    });

    return NextResponse.json({
      success: true,
      subscription: canceledSubscription
    });
  } catch (error) {
    console.error('[Admin] Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
