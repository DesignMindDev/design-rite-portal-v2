-- Fix RLS policies on user_roles table
-- Allow users to read their own role

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create a simple, efficient policy for users to read their own role
CREATE POLICY "users_can_read_own_role" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Also ensure super_admins can read all roles (for user management)
DROP POLICY IF EXISTS "super_admins_read_all_roles" ON public.user_roles;

CREATE POLICY "super_admins_read_all_roles" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "users_can_read_own_role" ON public.user_roles IS 'Allow authenticated users to read their own role';
COMMENT ON POLICY "super_admins_read_all_roles" ON public.user_roles IS 'Allow super_admins to read all user roles for user management';
