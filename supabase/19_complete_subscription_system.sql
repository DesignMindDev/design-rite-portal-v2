-- ============================================
-- COMPLETE SUBSCRIPTION SYSTEM FOR PORTAL V2
-- ============================================
-- Run this in Supabase SQL Editor
-- File: supabase/19_complete_subscription_system.sql

-- Drop existing incomplete tables if they exist
DROP TABLE IF EXISTS public.subscription_history CASCADE;
DROP TABLE IF EXISTS public.stripe_webhook_events CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- ============================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Subscription details
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',

  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Trial management
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Payment info
  default_payment_method TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- 2. STRIPE WEBHOOK EVENTS TABLE
-- ============================================
CREATE TABLE public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================
-- 3. SUBSCRIPTION HISTORY TABLE
-- ============================================
CREATE TABLE public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_tier TEXT,
  new_tier TEXT,
  old_status TEXT,
  new_status TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions(tier);
CREATE INDEX idx_webhook_events_stripe_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_processed ON public.stripe_webhook_events(processed);
CREATE INDEX idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX idx_subscription_history_subscription_id ON public.subscription_history(subscription_id);

-- ============================================
-- 5. ENABLE RLS
-- ============================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES - SUBSCRIPTIONS
-- ============================================

-- Users can read their own subscription
DROP POLICY IF EXISTS "users_read_own_subscription" ON public.subscriptions;
CREATE POLICY "users_read_own_subscription" ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all subscriptions
DROP POLICY IF EXISTS "admins_read_all_subscriptions" ON public.subscriptions;
CREATE POLICY "admins_read_all_subscriptions" ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Only service role can write subscriptions (via webhooks)
DROP POLICY IF EXISTS "service_role_manage_subscriptions" ON public.subscriptions;
CREATE POLICY "service_role_manage_subscriptions" ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7. RLS POLICIES - WEBHOOK EVENTS
-- ============================================

-- Only service role can access webhook events
DROP POLICY IF EXISTS "service_role_webhook_events" ON public.stripe_webhook_events;
CREATE POLICY "service_role_webhook_events" ON public.stripe_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 8. RLS POLICIES - SUBSCRIPTION HISTORY
-- ============================================

-- Users can read their own history
DROP POLICY IF EXISTS "users_read_own_history" ON public.subscription_history;
CREATE POLICY "users_read_own_history" ON public.subscription_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all history
DROP POLICY IF EXISTS "admins_read_all_history" ON public.subscription_history;
CREATE POLICY "admins_read_all_history" ON public.subscription_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin')
    )
  );

-- Service role can write history
DROP POLICY IF EXISTS "service_role_write_history" ON public.subscription_history;
CREATE POLICY "service_role_write_history" ON public.subscription_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 9. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. AUTO-CREATE SUBSCRIPTION ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  is_employee BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = NEW.id;

  -- Check if user is an employee
  is_employee := user_role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor');

  -- Create subscription record
  IF is_employee THEN
    -- Employees get unlimited access
    INSERT INTO public.subscriptions (
      user_id,
      tier,
      status,
      trial_start,
      trial_end
    ) VALUES (
      NEW.id,
      'enterprise',
      'active',
      NULL,
      NULL
    );
  ELSE
    -- Regular users get trial
    INSERT INTO public.subscriptions (
      user_id,
      tier,
      status,
      trial_start,
      trial_end
    ) VALUES (
      NEW.id,
      'trial',
      'trialing',
      NOW(),
      NOW() + INTERVAL '14 days'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_subscription();

-- ============================================
-- 11. MIGRATE EXISTING USERS
-- ============================================
-- Create subscriptions for existing users who don't have one
INSERT INTO public.subscriptions (user_id, tier, status, trial_start, trial_end)
SELECT
  u.id,
  CASE
    WHEN ur.role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor') THEN 'enterprise'
    ELSE 'trial'
  END,
  CASE
    WHEN ur.role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor') THEN 'active'
    ELSE 'trialing'
  END,
  CASE
    WHEN ur.role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor') THEN NULL
    ELSE NOW()
  END,
  CASE
    WHEN ur.role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor') THEN NULL
    ELSE NOW() + INTERVAL '14 days'
  END
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 12. HELPER FUNCTIONS
-- ============================================

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change(
  p_user_id UUID,
  p_subscription_id UUID,
  p_action TEXT,
  p_old_tier TEXT DEFAULT NULL,
  p_new_tier TEXT DEFAULT NULL,
  p_old_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO public.subscription_history (
    user_id,
    subscription_id,
    action,
    old_tier,
    new_tier,
    old_status,
    new_status,
    performed_by,
    notes
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_action,
    p_old_tier,
    p_new_tier,
    p_old_status,
    p_new_status,
    p_performed_by,
    p_notes
  )
  RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 13. COMMENTS
-- ============================================
COMMENT ON TABLE public.subscriptions IS 'User subscription records with Stripe integration';
COMMENT ON TABLE public.stripe_webhook_events IS 'Stripe webhook event deduplication and logging';
COMMENT ON TABLE public.subscription_history IS 'Audit trail of all subscription changes';
COMMENT ON FUNCTION create_user_subscription() IS 'Automatically creates subscription record when new user signs up';
COMMENT ON FUNCTION log_subscription_change IS 'Helper function to log subscription changes to history';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- You can now:
-- 1. Create webhook handler at /api/stripe/webhook
-- 2. Create customer portal at /api/stripe/customer-portal
-- 3. Update checkout to include user_id metadata
-- 4. Test the complete subscription flow
