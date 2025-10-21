-- =====================================================
-- LABOR CALCULATOR INTEGRATION
-- =====================================================
-- Extends workspace schema with labor rate management
-- Integrates with existing price_books system
-- AI-accessible for proposal refinement

-- =====================================================
-- 1. PROCUREMENT VEHICLES (Labor Rate Tables)
-- =====================================================
-- Stores labor rates per procurement vehicle (Sourcewell, OMNIA, etc.)

CREATE TABLE IF NOT EXISTS labor_rate_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Procurement Vehicle Info
  vehicle_name TEXT NOT NULL,  -- "Sourcewell", "OMNIA Partners", "Standard Commercial"
  vehicle_id TEXT NOT NULL,    -- Unique identifier for this vehicle

  -- Vehicle Pricing Strategy
  rate_multiplier NUMERIC(4, 2) DEFAULT 1.0,  -- 0.95 for Sourcewell discount
  min_margin_percent NUMERIC(5, 2) DEFAULT 20,
  overhead_percent NUMERIC(5, 2) DEFAULT 25,

  -- Status
  is_active BOOLEAN DEFAULT false,  -- Only one active vehicle per user
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, vehicle_id)
);

-- =====================================================
-- 2. LABOR RATES (Roles within each vehicle)
-- =====================================================
-- Stores rates for tech, lead, PM, engineer per vehicle

CREATE TABLE IF NOT EXISTS labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_table_id UUID REFERENCES labor_rate_tables(id) ON DELETE CASCADE,

  -- Role Info
  role_name TEXT NOT NULL CHECK (role_name IN ('tech', 'lead', 'pm', 'engineer', 'custom')),
  custom_role_title TEXT,  -- If role_name = 'custom', store custom title

  -- Rate Breakdown
  base_rate NUMERIC(10, 2) NOT NULL,      -- Base hourly wage
  burden_rate NUMERIC(10, 2) NOT NULL,    -- Taxes, insurance, benefits
  billed_rate NUMERIC(10, 2) NOT NULL,    -- What you charge the customer

  -- Rate Lock (prevent accidental changes)
  is_locked BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(rate_table_id, role_name)
);

-- =====================================================
-- 3. DEVICE LABOR STANDARDS
-- =====================================================
-- Stores standard labor hours per device type
-- Links to equipment price_book_items

CREATE TABLE IF NOT EXISTS device_labor_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Device Info
  device_type TEXT NOT NULL,  -- "Indoor Camera", "Outdoor Camera", "Access Control Door"
  category TEXT NOT NULL CHECK (category IN ('standard', 'ai', 'specialty', 'custom')),

  -- Labor Hours
  install_hours NUMERIC(6, 2) NOT NULL,     -- Physical installation time
  programming_hours NUMERIC(6, 2) NOT NULL, -- Configuration/programming time

  -- Optional: Link to equipment price book
  price_book_item_id UUID REFERENCES price_book_items(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, device_type)
);

-- =====================================================
-- 4. PROJECT LABOR CALCULATIONS (Cache)
-- =====================================================
-- Stores calculated labor costs for projects
-- Used by AI refinement and proposal generation

CREATE TABLE IF NOT EXISTS project_labor_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Calculation Inputs
  rate_table_id UUID REFERENCES labor_rate_tables(id),
  project_distance_miles NUMERIC(8, 2),
  project_duration_days INT,
  margin_target_percent NUMERIC(5, 2),

  -- Team Composition
  tech_count INT DEFAULT 0,
  lead_count INT DEFAULT 0,
  pm_count INT DEFAULT 0,
  engineer_count INT DEFAULT 0,

  -- Team Rates (snapshot at calculation time)
  tech_rate NUMERIC(10, 2),
  lead_rate NUMERIC(10, 2),
  pm_rate NUMERIC(10, 2),
  engineer_rate NUMERIC(10, 2),

  -- Calculated Totals
  total_labor_hours NUMERIC(10, 2),
  total_labor_cost NUMERIC(12, 2),
  total_travel_cost NUMERIC(12, 2),
  total_overhead_cost NUMERIC(12, 2),
  total_true_cost NUMERIC(12, 2),
  total_markup_amount NUMERIC(12, 2),
  total_sell_price NUMERIC(12, 2),
  actual_margin_percent NUMERIC(5, 2),

  -- Line Items (JSONB for flexibility)
  line_items JSONB,  -- Array of { device, hours, cost, etc. }

  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Only keep most recent calculation per project
  UNIQUE(project_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_labor_rate_tables_user_active
  ON labor_rate_tables(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_labor_rates_table
  ON labor_rates(rate_table_id);

CREATE INDEX IF NOT EXISTS idx_device_labor_standards_user
  ON device_labor_standards(user_id);

CREATE INDEX IF NOT EXISTS idx_device_labor_standards_category
  ON device_labor_standards(category);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- labor_rate_tables
ALTER TABLE labor_rate_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own labor rate tables"
  ON labor_rate_tables FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own labor rate tables"
  ON labor_rate_tables FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labor rate tables"
  ON labor_rate_tables FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labor rate tables"
  ON labor_rate_tables FOR DELETE
  USING (auth.uid() = user_id);

-- labor_rates
ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view labor rates for own tables"
  ON labor_rates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM labor_rate_tables
      WHERE labor_rate_tables.id = labor_rates.rate_table_id
      AND labor_rate_tables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create labor rates for own tables"
  ON labor_rates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM labor_rate_tables
      WHERE labor_rate_tables.id = labor_rates.rate_table_id
      AND labor_rate_tables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update labor rates for own tables"
  ON labor_rates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM labor_rate_tables
      WHERE labor_rate_tables.id = labor_rates.rate_table_id
      AND labor_rate_tables.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete labor rates for own tables"
  ON labor_rates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM labor_rate_tables
      WHERE labor_rate_tables.id = labor_rates.rate_table_id
      AND labor_rate_tables.user_id = auth.uid()
    )
  );

-- device_labor_standards
ALTER TABLE device_labor_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device labor standards"
  ON device_labor_standards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own device labor standards"
  ON device_labor_standards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device labor standards"
  ON device_labor_standards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own device labor standards"
  ON device_labor_standards FOR DELETE
  USING (auth.uid() = user_id);

-- project_labor_calculations
ALTER TABLE project_labor_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view labor calcs for own projects"
  ON project_labor_calculations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_labor_calculations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create labor calcs for own projects"
  ON project_labor_calculations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_labor_calculations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update labor calcs for own projects"
  ON project_labor_calculations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_labor_calculations.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- =====================================================
-- SEED DEFAULT DATA
-- =====================================================
-- Function to create default labor rate table for new users

CREATE OR REPLACE FUNCTION create_default_labor_rates(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_rate_table_id UUID;
  v_tech_rate_id UUID;
  v_lead_rate_id UUID;
  v_pm_rate_id UUID;
  v_eng_rate_id UUID;
BEGIN
  -- Create default "Standard Commercial" rate table
  INSERT INTO labor_rate_tables (
    user_id, vehicle_name, vehicle_id, rate_multiplier,
    min_margin_percent, overhead_percent, is_active, is_default
  ) VALUES (
    p_user_id, 'Standard Commercial', 'standard', 1.0, 30, 25, true, true
  ) RETURNING id INTO v_rate_table_id;

  -- Create default labor rates
  INSERT INTO labor_rates (rate_table_id, role_name, base_rate, burden_rate, billed_rate)
  VALUES
    (v_rate_table_id, 'tech', 35, 25, 90),
    (v_rate_table_id, 'lead', 45, 30, 120),
    (v_rate_table_id, 'pm', 55, 35, 140),
    (v_rate_table_id, 'engineer', 65, 35, 150);

  -- Create default device labor standards
  INSERT INTO device_labor_standards (user_id, device_type, category, install_hours, programming_hours)
  VALUES
    (p_user_id, 'Indoor Camera', 'standard', 2.0, 0.5),
    (p_user_id, 'Outdoor Camera', 'standard', 4.0, 0.5),
    (p_user_id, 'Access Control Door', 'standard', 8.0, 2.0),
    (p_user_id, 'License Plate Reader', 'ai', 8.0, 6.0),
    (p_user_id, 'Weapons Detection', 'ai', 12.0, 8.0),
    (p_user_id, 'Turnstile', 'specialty', 12.0, 4.0);

  RETURN v_rate_table_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Labor calculator schema added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New Tables:';
  RAISE NOTICE '  • labor_rate_tables (procurement vehicles)';
  RAISE NOTICE '  • labor_rates (role-based rates per vehicle)';
  RAISE NOTICE '  • device_labor_standards (hours per device type)';
  RAISE NOTICE '  • project_labor_calculations (cached calculations)';
  RAISE NOTICE '';
  RAISE NOTICE 'New Function:';
  RAISE NOTICE '  • create_default_labor_rates(user_id) - Creates default rates';
  RAISE NOTICE '';
  RAISE NOTICE 'AI can now reference labor rates for proposal refinement!';
END $$;
