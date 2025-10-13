ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check CHECK (tier IN ('free', 'starter', 'pro', 'enterprise'));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete'));
ALTER TABLE public.subscriptions ALTER COLUMN billing_period DROP NOT NULL;
ALTER TABLE public.subscriptions ALTER COLUMN amount DROP NOT NULL;