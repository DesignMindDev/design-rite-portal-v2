-- ============================================
-- FRESH START MIGRATION - Portal V2
-- Date: 2025-10-13
-- Purpose: Clean slate for user roles, profiles, and subscriptions
-- ============================================

-- Step 1: Drop existing triggers first (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;

-- Step 2: Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 3: Drop existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- ============================================
-- TABLE 1: Profiles
-- Links Supabase Auth users to profile data
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profiles are created automatically"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
  ON public.profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TABLE 2: User Roles
-- Role-based access control
-- ============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor', 'user')),
  domain_override BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Service role can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TABLE 3: Subscriptions
-- Subscription tiers and limits
-- ============================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('trial', 'free', 'starter', 'professional', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'expired')),

  -- Assessment limits
  assessment_limit INTEGER NOT NULL DEFAULT 3,
  assessments_used INTEGER NOT NULL DEFAULT 0,

  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,

  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('stripe', 'manual')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription usage"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- FUNCTION: Handle New User Signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  );

  -- Create default user role
  INSERT INTO public.user_roles (user_id, role, domain_override)
  VALUES (
    NEW.id,
    'user',
    FALSE
  );

  -- Create 14-day trial subscription with 3 assessments
  INSERT INTO public.subscriptions (
    user_id,
    tier,
    status,
    assessment_limit,
    assessments_used,
    trial_start,
    trial_end,
    source
  )
  VALUES (
    NEW.id,
    'trial',
    'trialing',
    3,
    0,
    NOW(),
    NOW() + INTERVAL '14 days',
    'manual'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to create profile/role/subscription on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions(tier);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_trial_end ON public.subscriptions(trial_end);

-- ============================================
-- COMMENTS for Documentation
-- ============================================

COMMENT ON TABLE public.profiles IS 'User profile data linked to Supabase Auth';
COMMENT ON TABLE public.user_roles IS 'Role-based access control for users';
COMMENT ON TABLE public.subscriptions IS 'Subscription tiers and usage limits';

COMMENT ON COLUMN public.subscriptions.tier IS 'trial (3 assessments, 14 days) | starter (10/month) | professional (30/month) | enterprise (30/month)';
COMMENT ON COLUMN public.subscriptions.assessment_limit IS 'Max assessments per period: trial=3, starter=10, pro=30, enterprise=30';
COMMENT ON COLUMN public.subscriptions.assessments_used IS 'Current assessment usage count (resets monthly for paid tiers)';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Portal V2 Fresh Start Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables Created:';
  RAISE NOTICE '   - profiles (with RLS)';
  RAISE NOTICE '   - user_roles (with RLS)';
  RAISE NOTICE '   - subscriptions (with RLS)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Functions Created:';
  RAISE NOTICE '   - handle_new_user() - Auto-creates profile/role/subscription on signup';
  RAISE NOTICE '   - update_updated_at_column() - Maintains updated_at timestamps';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Triggers Active:';
  RAISE NOTICE '   - on_auth_user_created - Fires on new user signup';
  RAISE NOTICE '   - updated_at triggers on all tables';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Subscription Tiers:';
  RAISE NOTICE '   - Trial: 3 assessments, 14 days';
  RAISE NOTICE '   - Starter: 10 assessments/month';
  RAISE NOTICE '   - Professional: 30 assessments/month';
  RAISE NOTICE '   - Enterprise: 30 assessments/month';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Next Step: Add yourself as super_admin!';
  RAISE NOTICE '   1. Sign up with your email';
  RAISE NOTICE '   2. Run: UPDATE user_roles SET role = ''super_admin'' WHERE user_id = ''YOUR_USER_ID'';';
  RAISE NOTICE '   3. You can now manage all users and assign admin roles';
  RAISE NOTICE '';
END $$;
