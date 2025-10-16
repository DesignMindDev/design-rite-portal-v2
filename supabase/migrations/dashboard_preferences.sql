-- Dashboard Preferences Table
-- Stores user-specific dashboard customization settings

CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Widget Visibility (JSON object with boolean flags)
  widget_visibility JSONB DEFAULT '{
    "realtimeActivity": true,
    "systemHealth": true,
    "userEngagement": true,
    "revenueMetrics": true,
    "leadFunnel": true,
    "aiPerformance": true,
    "activityFeed": true,
    "operationsDashboard": true
  }'::jsonb,

  -- Layout Preferences
  card_size VARCHAR(20) DEFAULT 'compact' CHECK (card_size IN ('compact', 'standard', 'large')),
  grid_density VARCHAR(20) DEFAULT 'dense' CHECK (grid_density IN ('dense', 'comfortable')),
  default_time_range VARCHAR(10) DEFAULT '24h' CHECK (default_time_range IN ('24h', '7d', '30d')),
  auto_refresh BOOLEAN DEFAULT true,

  -- Theme Customization
  accent_color VARCHAR(20) DEFAULT 'indigo' CHECK (accent_color IN ('indigo', 'blue', 'purple', 'green', 'red', 'amber')),
  chart_style VARCHAR(20) DEFAULT 'modern' CHECK (chart_style IN ('modern', 'classic')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one preference set per user
  UNIQUE(user_id)
);

-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id ON dashboard_preferences(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON dashboard_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON dashboard_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON dashboard_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Super admins can view all preferences
CREATE POLICY "Super admins can view all preferences"
  ON dashboard_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
CREATE TRIGGER dashboard_preferences_updated_at
  BEFORE UPDATE ON dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_preferences_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON dashboard_preferences TO authenticated;

-- Comments for documentation
COMMENT ON TABLE dashboard_preferences IS 'User-specific dashboard customization settings including widget visibility, layout preferences, and theme options';
COMMENT ON COLUMN dashboard_preferences.widget_visibility IS 'JSON object controlling visibility of dashboard widgets';
COMMENT ON COLUMN dashboard_preferences.card_size IS 'Size of metric cards: compact, standard, or large';
COMMENT ON COLUMN dashboard_preferences.grid_density IS 'Grid layout density: dense or comfortable';
COMMENT ON COLUMN dashboard_preferences.default_time_range IS 'Default time range for metrics: 24h, 7d, or 30d';
COMMENT ON COLUMN dashboard_preferences.auto_refresh IS 'Enable auto-refresh of dashboard metrics';
COMMENT ON COLUMN dashboard_preferences.accent_color IS 'Primary accent color for the dashboard';
COMMENT ON COLUMN dashboard_preferences.chart_style IS 'Visual style for charts: modern or classic';
