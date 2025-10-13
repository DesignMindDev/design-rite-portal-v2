-- ============================================
-- Helper Query: Check User Setup
-- Run this after signup to verify everything was created
-- ============================================

-- View all users with their roles and subscriptions
SELECT
  au.id as user_id,
  au.email,
  au.created_at as signup_date,
  p.full_name,
  p.company,
  ur.role,
  ur.domain_override,
  s.tier as subscription_tier,
  s.status as subscription_status,
  s.assessment_limit,
  s.assessments_used,
  s.trial_start,
  s.trial_end,
  CASE
    WHEN s.trial_end > NOW() THEN EXTRACT(DAY FROM (s.trial_end - NOW())) || ' days remaining'
    WHEN s.trial_end < NOW() THEN 'EXPIRED'
    ELSE 'No trial'
  END as trial_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
LEFT JOIN public.subscriptions s ON au.id = s.user_id
ORDER BY au.created_at DESC;

-- ============================================
-- Quick Promotion to Super Admin
-- Replace 'your-email@example.com' with your email
-- ============================================

-- Step 1: Find your user_id
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Promote to super_admin (copy your user_id from above)
-- UPDATE user_roles SET role = 'super_admin' WHERE user_id = 'PASTE-USER-ID-HERE';

-- Step 3: Verify promotion
SELECT
  au.email,
  ur.role,
  s.tier,
  s.assessment_limit
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN subscriptions s ON au.id = s.user_id
WHERE au.email = 'your-email@example.com';
