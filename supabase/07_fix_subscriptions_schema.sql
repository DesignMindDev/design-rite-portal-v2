-- Fix subscriptions table schema to match the useSubscription hook expectations

-- 1. Add missing columns needed by useSubscription hook
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS max_documents INTEGER DEFAULT 2;

-- 2. Drop conflicting CHECK constraints
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- 3. Add correct CHECK constraints
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check
  CHECK (tier IN ('free', 'starter', 'pro', 'enterprise'));

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete'));

-- 4. Make billing_period nullable (not critical for app)
ALTER TABLE public.subscriptions ALTER COLUMN billing_period DROP NOT NULL;

-- 5. Make amount nullable (free tier has no amount)
ALTER TABLE public.subscriptions ALTER COLUMN amount DROP NOT NULL;

-- Show updated schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subscriptions'
ORDER BY ordinal_position;
