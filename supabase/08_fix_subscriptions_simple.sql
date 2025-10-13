-- Add missing columns
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS max_documents INTEGER DEFAULT 2;

-- Drop old constraints
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add new constraints
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check
  CHECK (tier IN ('free', 'starter', 'pro', 'enterprise'));

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete'));

-- Make columns nullable
ALTER TABLE public.subscriptions ALTER COLUMN billing_period DROP NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN amount DROP NOT NULL;
