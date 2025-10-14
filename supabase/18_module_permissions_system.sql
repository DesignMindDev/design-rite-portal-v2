-- Module Permissions System
-- Allows super_admins to assign specific module access to users
-- Supports current modules and future module expansion

-- 1. Create modules table (defines all available modules in the system)
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  route TEXT, -- URL route (e.g., '/dashboard', '/ai-platform')
  category TEXT, -- 'core', 'tools', 'admin', 'analytics', etc.
  is_active BOOLEAN DEFAULT true,
  requires_subscription BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user_module_permissions table (junction table for user-module access)
CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  notes TEXT,
  UNIQUE(user_id, module_id)
);

-- 3. Insert default modules (current Portal V2 modules)
INSERT INTO public.modules (name, display_name, description, icon, route, category, is_active, requires_subscription)
VALUES
  -- Core Modules
  ('dashboard', 'Dashboard', 'Main portal dashboard with overview', 'LayoutDashboard', '/dashboard', 'core', true, false),
  ('welcome', 'Welcome', 'Welcome page with action cards', 'Home', '/welcome', 'core', true, false),

  -- AI & Analysis Modules
  ('ai_platform', 'AI Security Platform', 'Design-Rite AI workspace (V4)', 'Bot', '/workspace', 'ai', true, true),
  ('ai_tools', 'AI Tools', 'AI-powered business tools', 'Sparkles', '/ai-tools', 'ai', true, true),

  -- Document Management
  ('documents', 'Documents', 'Proposal and document management', 'FileText', '/documents', 'documents', true, false),
  ('templates', 'Templates', 'Document templates library', 'FileTemplate', '/templates', 'documents', true, false),

  -- Business Tools
  ('business_tools', 'Business Tools', 'Business management utilities', 'Briefcase', '/tools', 'tools', true, false),
  ('analytics', 'Analytics', 'Reports and analytics dashboard', 'BarChart3', '/analytics', 'analytics', true, true),
  ('insights', 'Insights', 'Business insights and metrics', 'TrendingUp', '/insights', 'analytics', true, true),

  -- Admin Modules (employee-only by default)
  ('admin_dashboard', 'Admin Dashboard', 'Mission Control admin panel', 'Shield', '/admin', 'admin', true, false),
  ('user_management', 'User Management', 'Create and manage users', 'Users', '/admin/super', 'admin', true, false),
  ('team_management', 'Team Management', 'Manage teams and groups', 'UsersRound', '/admin/teams', 'admin', true, false),
  ('blog_manager', 'Blog Manager', 'Manage blog posts and content', 'Newspaper', '/admin/blog', 'admin', true, false),
  ('marketing_studio', 'Marketing Studio', 'Marketing campaign tools', 'Megaphone', '/admin/marketing', 'admin', true, false),
  ('creative_studio', 'Creative Studio', 'Design and creative assets', 'Palette', '/admin/creative', 'admin', true, false),

  -- Account & Settings
  ('profile', 'Profile', 'User profile settings', 'User', '/profile', 'settings', true, false),
  ('subscription', 'Subscription', 'Manage subscription and billing', 'CreditCard', '/subscription', 'settings', true, false),
  ('settings', 'Settings', 'Account settings and preferences', 'Settings', '/settings', 'settings', true, false)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  route = EXCLUDED.route,
  category = EXCLUDED.category,
  updated_at = NOW();

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id ON public.user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_module_id ON public.user_module_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_category ON public.modules(category);
CREATE INDEX IF NOT EXISTS idx_modules_is_active ON public.modules(is_active);

-- 5. Enable RLS on new tables
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for modules table

-- Everyone can read active modules
DROP POLICY IF EXISTS "modules_read_active" ON public.modules;
CREATE POLICY "modules_read_active" ON public.modules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Super admins can manage modules
DROP POLICY IF EXISTS "modules_super_admin_manage" ON public.modules;
CREATE POLICY "modules_super_admin_manage" ON public.modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
    )
  );

-- 7. RLS Policies for user_module_permissions table

-- Users can read their own permissions
DROP POLICY IF EXISTS "user_module_permissions_read_own" ON public.user_module_permissions;
CREATE POLICY "user_module_permissions_read_own" ON public.user_module_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super admins can read all permissions
DROP POLICY IF EXISTS "user_module_permissions_super_admin_read" ON public.user_module_permissions;
CREATE POLICY "user_module_permissions_super_admin_read" ON public.user_module_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
    )
  );

-- Super admins can insert/update/delete permissions
DROP POLICY IF EXISTS "user_module_permissions_super_admin_manage" ON public.user_module_permissions;
CREATE POLICY "user_module_permissions_super_admin_manage" ON public.user_module_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
    )
  );

-- 8. Create helper function to check if user has module access
CREATE OR REPLACE FUNCTION public.user_has_module_access(
  p_user_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access BOOLEAN;
  user_role_value TEXT;
  is_employee_role BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO user_role_value
  FROM public.user_roles
  WHERE user_id = p_user_id;

  -- Check if user is an employee
  is_employee_role := user_role_value IN ('super_admin', 'admin', 'manager', 'developer', 'contractor');

  -- Super admins have access to everything
  IF user_role_value = 'super_admin' THEN
    RETURN true;
  END IF;

  -- Check explicit module permission
  SELECT EXISTS (
    SELECT 1
    FROM public.user_module_permissions ump
    JOIN public.modules m ON ump.module_id = m.id
    WHERE ump.user_id = p_user_id
    AND m.name = p_module_name
    AND m.is_active = true
    AND (ump.expires_at IS NULL OR ump.expires_at > NOW())
  ) INTO has_access;

  -- If explicit permission exists, return it
  IF has_access THEN
    RETURN true;
  END IF;

  -- Default access rules based on module category and user role
  -- Admin modules: only employees with permission
  -- Core modules: all authenticated users
  -- Other modules: check subscription or explicit permission

  SELECT EXISTS (
    SELECT 1
    FROM public.modules m
    WHERE m.name = p_module_name
    AND m.is_active = true
    AND (
      -- Core modules available to all
      (m.category = 'core') OR
      -- Settings modules available to all
      (m.category = 'settings') OR
      -- Admin modules only for employees
      (m.category = 'admin' AND is_employee_role)
    )
  ) INTO has_access;

  RETURN has_access;
END;
$$;

-- 9. Create function to grant module access
CREATE OR REPLACE FUNCTION public.grant_module_access(
  p_user_id UUID,
  p_module_name TEXT,
  p_granted_by UUID,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id UUID;
  v_permission_id UUID;
BEGIN
  -- Get module ID
  SELECT id INTO v_module_id
  FROM public.modules
  WHERE name = p_module_name;

  IF v_module_id IS NULL THEN
    RAISE EXCEPTION 'Module % not found', p_module_name;
  END IF;

  -- Insert or update permission
  INSERT INTO public.user_module_permissions (user_id, module_id, granted_by, expires_at, notes)
  VALUES (p_user_id, v_module_id, p_granted_by, p_expires_at, p_notes)
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    granted_by = EXCLUDED.granted_by,
    granted_at = NOW(),
    expires_at = EXCLUDED.expires_at,
    notes = EXCLUDED.notes
  RETURNING id INTO v_permission_id;

  RETURN v_permission_id;
END;
$$;

-- 10. Create function to revoke module access
CREATE OR REPLACE FUNCTION public.revoke_module_access(
  p_user_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id UUID;
BEGIN
  -- Get module ID
  SELECT id INTO v_module_id
  FROM public.modules
  WHERE name = p_module_name;

  IF v_module_id IS NULL THEN
    RAISE EXCEPTION 'Module % not found', p_module_name;
  END IF;

  -- Delete permission
  DELETE FROM public.user_module_permissions
  WHERE user_id = p_user_id
  AND module_id = v_module_id;

  RETURN FOUND;
END;
$$;

-- 11. Create function to get user's accessible modules
CREATE OR REPLACE FUNCTION public.get_user_modules(p_user_id UUID)
RETURNS TABLE (
  module_id UUID,
  name TEXT,
  display_name TEXT,
  description TEXT,
  icon TEXT,
  route TEXT,
  category TEXT,
  has_explicit_permission BOOLEAN,
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.display_name,
    m.description,
    m.icon,
    m.route,
    m.category,
    ump.id IS NOT NULL AS has_explicit_permission,
    ump.granted_at,
    ump.expires_at
  FROM public.modules m
  LEFT JOIN public.user_module_permissions ump ON m.id = ump.module_id AND ump.user_id = p_user_id
  WHERE m.is_active = true
  AND user_has_module_access(p_user_id, m.name)
  ORDER BY m.category, m.display_name;
END;
$$;

-- 12. Add comments for documentation
COMMENT ON TABLE public.modules IS 'Defines all available modules in the system';
COMMENT ON TABLE public.user_module_permissions IS 'Junction table for user-specific module access permissions';
COMMENT ON FUNCTION public.user_has_module_access IS 'Checks if a user has access to a specific module';
COMMENT ON FUNCTION public.grant_module_access IS 'Grants module access to a user';
COMMENT ON FUNCTION public.revoke_module_access IS 'Revokes module access from a user';
COMMENT ON FUNCTION public.get_user_modules IS 'Returns all modules accessible to a user';

-- 13. Create updated_at trigger for modules
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
