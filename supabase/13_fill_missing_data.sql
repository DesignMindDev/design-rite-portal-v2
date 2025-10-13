INSERT INTO public.user_roles (user_id, role, assigned_at)
VALUES
  ('0934c237-b009-484b-9b18-fb69e6d00ead', 'admin', NOW()),
  ('bc6cc053-c141-427e-9b2d-17197f5c7a44', 'user', NOW()),
  ('c0dd3708-1968-45d1-923d-51ac175b7b76', 'admin', NOW()),
  ('5e921cb8-cd86-447f-87f2-cecd0ddba21b', 'admin', NOW());

INSERT INTO public.subscriptions (user_id, tier, status, is_trial, max_documents, created_at, updated_at)
VALUES
  ('0934c237-b009-484b-9b18-fb69e6d00ead', 'free', 'active', FALSE, 2, NOW(), NOW()),
  ('bc6cc053-c141-427e-9b2d-17197f5c7a44', 'free', 'active', FALSE, 2, NOW(), NOW()),
  ('c0dd3708-1968-45d1-923d-51ac175b7b76', 'free', 'active', FALSE, 2, NOW(), NOW()),
  ('7de15b18-514d-43f2-834f-5aed0ac13136', 'free', 'active', FALSE, 2, NOW(), NOW()),
  ('5e921cb8-cd86-447f-87f2-cecd0ddba21b', 'free', 'active', FALSE, 2, NOW(), NOW());