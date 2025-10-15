-- Create test user with password for testing forgot password flow
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/aeorianxnxpxveoxzhov/sql

-- Email: dan@design-rite.com
-- Password: TestPassword123!

-- Note: This uses Supabase's auth.users table directly
-- The password will be hashed automatically by Supabase

SELECT auth.create_user(
  '{
    "email": "dan@design-rite.com",
    "password": "TestPassword123!",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Dan Koziar",
      "company": "Design-Rite",
      "source": "manual_test_sql"
    }
  }'::jsonb
);

-- After running this, you can:
-- 1. Sign in at http://localhost:3001/auth with dan@design-rite.com / TestPassword123!
-- 2. Test forgot password at http://localhost:3001/forgot-password
-- 3. Reset password flow will work (though email may not deliver in dev)
