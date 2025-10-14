/**
// Force dynamic rendering (do not pre-render at build time)
export const dynamic = 'force-dynamic';
 * Admin API: Upgrade Subscription Plan
 * Allows admins to manually upgrade/downgrade a customer's subscription tier
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

// Map tiers to Stripe Price IDs
function getPriceIdForTier(tier: string): string {
  const priceIds: Record<string, string> = {
    starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!,
    professional: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL!,
    enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!,
  };

  return priceIds[tier] || priceIds.starter;
}

export async function POST(req: NextRequest) {
  // Check admin authentication
  const admin = await requireRole(['super_admin', 'admin']);
  if (admin instanceof NextResponse) return admin; // Return error if not authorized

  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const { subscription_id, new_tier } = await req.json();

    if (!subscription_id || !new_tier) {
      return NextResponse.json(
        { error: 'Missing subscription_id or new_tier' },
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

    // Get current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription_id);

    // Get new price ID
    const newPriceId = getPriceIdForTier(new_tier);

    // Update subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(subscription_id, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Prorate charges
    });

    // Get new amount
    const newAmount = updatedSubscription.items.data[0].price.unit_amount || 0;

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        tier: new_tier,
        amount: newAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);

    // Update user profile
    await supabase
      .from('profiles')
      .update({
        subscription_tier: new_tier,
      })
      .eq('id', sub.user_id);

    // Determine action (upgrade or downgrade)
    const tierOrder: Record<string, number> = {
      starter: 1,
      professional: 2,
      enterprise: 3
    };
    const action = tierOrder[new_tier] > tierOrder[sub.tier] ? 'upgraded' : 'downgraded';

    // Log history
    await supabase
      .from('subscription_history')
      .insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        action,
        old_tier: sub.tier,
        new_tier: new_tier,
        reason: 'Admin manual change',
        is_automatic: false,
      });

    // Log admin action
    await logAdminAction({
      userId: admin.id,
      action: `subscription_${action}`,
      details: {
        subscription_id,
        customer_id: sub.user_id,
        old_tier: sub.tier,
        new_tier,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('[Admin] Error upgrading subscription:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
