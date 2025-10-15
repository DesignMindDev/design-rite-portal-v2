-- =====================================================
-- Usage Tracking System for Assessment Limits
-- Created: 2025-10-15
-- Purpose: Track monthly assessment usage per subscription tier
-- =====================================================

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Feature tracking
  feature_type TEXT NOT NULL CHECK (feature_type IN ('assessment', 'quote', 'export', 'api_call')),
  usage_count INTEGER NOT NULL DEFAULT 0,
  limit_amount INTEGER NOT NULL DEFAULT 0, -- -1 = unlimited

  -- Period tracking
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, feature_type, period_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON usage_tracking(feature_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature ON usage_tracking(user_id, feature_type);

-- Enable Row Level Security
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert usage records
CREATE POLICY "System can insert usage"
  ON usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- System can update usage counts
CREATE POLICY "System can update usage"
  ON usage_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all usage"
  ON usage_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get current usage for a user and feature
CREATE OR REPLACE FUNCTION get_current_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS TABLE (
  usage_count INTEGER,
  limit_amount INTEGER,
  period_start DATE,
  period_end DATE,
  is_at_limit BOOLEAN,
  is_near_limit BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ut.usage_count,
    ut.limit_amount,
    ut.period_start,
    ut.period_end,
    CASE
      WHEN ut.limit_amount = -1 THEN FALSE -- Unlimited
      ELSE ut.usage_count >= ut.limit_amount
    END AS is_at_limit,
    CASE
      WHEN ut.limit_amount = -1 THEN FALSE -- Unlimited
      ELSE ut.usage_count >= (ut.limit_amount * 0.8)::INTEGER
    END AS is_near_limit
  FROM usage_tracking ut
  WHERE ut.user_id = p_user_id
    AND ut.feature_type = p_feature_type
    AND CURRENT_DATE BETWEEN ut.period_start AND ut.period_end
  ORDER BY ut.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id UUID;
  v_tier TEXT;
  v_limit INTEGER;
  v_current_usage INTEGER;
  v_record_exists BOOLEAN;
BEGIN
  -- Get user's subscription tier and ID
  SELECT s.id, s.tier INTO v_subscription_id, v_tier
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  LIMIT 1;

  -- Determine limit based on tier
  v_limit := CASE
    WHEN v_tier IN ('enterprise', 'pro') AND p_feature_type = 'assessment' THEN -1 -- Unlimited for enterprise
    WHEN v_tier = 'professional' AND p_feature_type = 'assessment' THEN 40
    WHEN v_tier IN ('starter', 'free') AND p_feature_type = 'assessment' THEN 10
    WHEN v_tier = 'trial' AND p_feature_type = 'assessment' THEN 3 -- Limited trial: 3 assessments only
    ELSE 10 -- Default
  END;

  -- Check if record exists for current period
  SELECT EXISTS (
    SELECT 1 FROM usage_tracking
    WHERE user_id = p_user_id
      AND feature_type = p_feature_type
      AND CURRENT_DATE BETWEEN period_start AND period_end
  ) INTO v_record_exists;

  IF v_record_exists THEN
    -- Update existing record
    UPDATE usage_tracking
    SET
      usage_count = usage_count + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND feature_type = p_feature_type
      AND CURRENT_DATE BETWEEN period_start AND period_end;
  ELSE
    -- Create new record for current period
    INSERT INTO usage_tracking (
      user_id,
      subscription_id,
      feature_type,
      usage_count,
      limit_amount,
      period_start,
      period_end
    ) VALUES (
      p_user_id,
      v_subscription_id,
      p_feature_type,
      1, -- Starting at 1
      v_limit,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days'
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user can perform action (has remaining usage)
CREATE OR REPLACE FUNCTION can_use_feature(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_usage RECORD;
BEGIN
  -- Get current usage
  SELECT * INTO v_usage
  FROM get_current_usage(p_user_id, p_feature_type);

  -- If no usage record exists yet, user can use feature
  IF v_usage IS NULL THEN
    RETURN TRUE;
  END IF;

  -- If unlimited (-1), always allow
  IF v_usage.limit_amount = -1 THEN
    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN v_usage.usage_count < v_usage.limit_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reset monthly usage (for cron job)
CREATE OR REPLACE FUNCTION reset_expired_usage()
RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  -- Archive expired usage periods (don't delete, keep for history)
  -- Just create new periods for users who had previous tracking
  INSERT INTO usage_tracking (
    user_id,
    subscription_id,
    feature_type,
    usage_count,
    limit_amount,
    period_start,
    period_end
  )
  SELECT
    ut.user_id,
    ut.subscription_id,
    ut.feature_type,
    0, -- Reset to 0
    CASE
      WHEN s.tier IN ('enterprise', 'pro') THEN -1 -- Unlimited
      WHEN s.tier = 'professional' THEN 40
      WHEN s.tier IN ('starter', 'free') THEN 10
      WHEN s.tier = 'trial' THEN 3
      ELSE 10
    END AS limit_amount,
    CURRENT_DATE AS period_start,
    CURRENT_DATE + INTERVAL '30 days' AS period_end
  FROM usage_tracking ut
  JOIN subscriptions s ON s.id = ut.subscription_id
  WHERE ut.period_end < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM usage_tracking ut2
      WHERE ut2.user_id = ut.user_id
        AND ut2.feature_type = ut.feature_type
        AND CURRENT_DATE BETWEEN ut2.period_start AND ut2.period_end
    )
  ON CONFLICT (user_id, feature_type, period_start) DO NOTHING;

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Initial Data Population
-- =====================================================

-- Create initial usage tracking records for all existing users with assessments
-- This ensures existing users start with clean slate
INSERT INTO usage_tracking (
  user_id,
  subscription_id,
  feature_type,
  usage_count,
  limit_amount,
  period_start,
  period_end
)
SELECT
  s.user_id,
  s.id AS subscription_id,
  'assessment' AS feature_type,
  0 AS usage_count,
  CASE
    WHEN s.tier IN ('enterprise', 'pro') THEN -1 -- Unlimited
    WHEN s.tier = 'professional' THEN 40
    WHEN s.tier IN ('starter', 'free') THEN 10
    WHEN s.tier = 'trial' THEN 3
    ELSE 10
  END AS limit_amount,
  CURRENT_DATE AS period_start,
  CURRENT_DATE + INTERVAL '30 days' AS period_end
FROM subscriptions s
WHERE NOT EXISTS (
  SELECT 1 FROM usage_tracking ut
  WHERE ut.user_id = s.user_id
    AND ut.feature_type = 'assessment'
    AND CURRENT_DATE BETWEEN ut.period_start AND ut.period_end
)
ON CONFLICT (user_id, feature_type, period_start) DO NOTHING;

-- =====================================================
-- Grants
-- =====================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_current_usage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_use_feature(UUID, TEXT) TO authenticated;

-- Grant execute on reset function to service role only (for cron jobs)
GRANT EXECUTE ON FUNCTION reset_expired_usage() TO service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE usage_tracking IS 'Tracks feature usage limits per user per billing period';
COMMENT ON FUNCTION get_current_usage(UUID, TEXT) IS 'Get current usage statistics for a user and feature';
COMMENT ON FUNCTION increment_usage(UUID, TEXT) IS 'Increment usage counter after successful feature use';
COMMENT ON FUNCTION can_use_feature(UUID, TEXT) IS 'Check if user has remaining usage quota for a feature';
COMMENT ON FUNCTION reset_expired_usage() IS 'Reset usage counters for expired periods (run daily via cron)';
