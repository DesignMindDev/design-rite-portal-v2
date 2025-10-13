INSERT INTO public.profiles (id, email, full_name, company, created_at, updated_at)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', ''), COALESCE(u.raw_user_meta_data->>'company', ''), u.created_at, NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT u.id, CASE WHEN u.email LIKE '%@design-rite.com' THEN 'admin' ELSE 'user' END, NOW()
FROM auth.users u
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE r.user_id IS NULL;

INSERT INTO public.subscriptions (user_id, tier, status, is_trial, max_documents, created_at, updated_at)
SELECT u.id, 'free', 'active', FALSE, 2, u.created_at, NOW()
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
WHERE s.user_id IS NULL;