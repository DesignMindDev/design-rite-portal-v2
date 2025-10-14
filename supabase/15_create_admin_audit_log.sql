-- Create admin_actions table for audit logging
-- This tracks all admin actions for compliance and debugging

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'create_user', 'delete_user', 'update_role', 'reset_password', etc.
  target_id UUID, -- ID of the affected user/resource
  target_email TEXT, -- Email for easier searching
  details JSONB, -- Additional context (role, company, etc.)
  ip_address TEXT, -- Request IP for security tracking
  user_agent TEXT, -- Browser/client info
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failure', 'partial'
  error_message TEXT, -- If status is failure
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON admin_actions(action);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_id ON admin_actions(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_email ON admin_actions(target_email);
CREATE INDEX IF NOT EXISTS idx_admin_actions_status ON admin_actions(status);

-- RLS Policies: Only super_admins can view audit logs
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Super admins can view all audit logs
CREATE POLICY "super_admins_view_all_audit_logs" ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Admins can view their own audit logs
CREATE POLICY "admins_view_own_audit_logs" ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'manager')
    )
  );

-- Service role can insert audit logs (API routes use service key)
-- Note: INSERT policies are not needed as API will use service role key

COMMENT ON TABLE admin_actions IS 'Audit log for all admin actions - tracks who did what, when, and from where';
COMMENT ON COLUMN admin_actions.action IS 'Type of action performed (create_user, delete_user, update_role, etc.)';
COMMENT ON COLUMN admin_actions.target_id IS 'ID of affected user or resource';
COMMENT ON COLUMN admin_actions.target_email IS 'Email of affected user for easier searching';
COMMENT ON COLUMN admin_actions.details IS 'JSON object with action-specific details';
COMMENT ON COLUMN admin_actions.ip_address IS 'IP address of the admin who performed the action';
COMMENT ON COLUMN admin_actions.status IS 'Result of the action: success, failure, or partial';
