-- ============================================
-- Add Performance Indexes for User Queries
-- ============================================
-- Run this in Supabase SQL Editor to improve query performance

-- Index on profiles.email for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email);

-- Index on user_roles.user_id for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles(user_id);

-- Composite index for common role queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
  ON public.user_roles(user_id, role);

-- Index on subscriptions.user_id for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

-- Index on subscriptions.stripe_customer_id for Stripe webhooks
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON public.subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_roles', 'subscriptions')
ORDER BY tablename, indexname;
