-- Check what constraint values are allowed for subscriptions
SELECT
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE contype = 'c'
  AND n.nspname = 'public'
  AND conrelid = 'public.subscriptions'::regclass;
