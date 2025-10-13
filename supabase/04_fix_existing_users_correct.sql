-- Fix existing users who don't have profile/role/subscription data
-- This matches the ACTUAL schema in your database

-- Insert missing profiles for existing auth users
INSERT INTO public.profiles (id, email, full_name, company, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'company', ''),
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Insert missing user roles for existing auth users
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT
  u.id,
  CASE
    WHEN u.email LIKE '%@design-rite.com' THEN 'admin'
    ELSE 'user'
  END as role,
  NOW()
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE r.user_id IS NULL;

-- Insert missing subscriptions for existing auth users
INSERT INTO public.subscriptions (user_id, tier, status, billing_period, amount, currency, created_at, updated_at)
SELECT
  u.id,
  'free',
  'active',
  'monthly',
  0,
  'usd',
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
WHERE s.user_id IS NULL;

-- Show results
SELECT
  u.email,
  u.created_at as user_created,
  p.full_name,
  p.company,
  r.role,
  s.tier,
  s.status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles r ON u.id = r.user_id
LEFT JOIN public.subscriptions s ON u.id = s.user_id
ORDER BY u.created_at DESC;
