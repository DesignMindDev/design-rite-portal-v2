-- V4 Leads Integration
-- This table stores leads/contacts from the V4 marketing site

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS v4_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Lead source
  source TEXT NOT NULL, -- 'contact_form', 'quick_estimate', 'ai_discovery', 'demo_request'

  -- Contact info
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  message TEXT,

  -- Form data (full submission for reference)
  form_data JSONB,

  -- Lead management
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'lost'
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_v4_leads_email ON v4_leads(email);
CREATE INDEX idx_v4_leads_status ON v4_leads(status);
CREATE INDEX idx_v4_leads_source ON v4_leads(source);
CREATE INDEX idx_v4_leads_created_at ON v4_leads(created_at DESC);

-- RLS Policies (admin only)
ALTER TABLE v4_leads ENABLE ROW LEVEL SECURITY;

-- Employees can read all leads
CREATE POLICY "Employees can read v4_leads"
  ON v4_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'manager', 'developer')
    )
  );

-- Super admins and admins can insert leads
CREATE POLICY "Admins can insert v4_leads"
  ON v4_leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Super admins and admins can update leads
CREATE POLICY "Admins can update v4_leads"
  ON v4_leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'manager')
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER update_v4_leads_updated_at
  BEFORE UPDATE ON v4_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE v4_leads IS 'Leads from V4 marketing site (contact forms, estimates, etc.)';