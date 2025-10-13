SELECT
  u.email,
  u.id as user_id,
  CASE WHEN p.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile,
  CASE WHEN r.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_role,
  CASE WHEN s.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_subscription
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles r ON u.id = r.user_id
LEFT JOIN public.subscriptions s ON u.id = s.user_id
ORDER BY u.created_at DESC;