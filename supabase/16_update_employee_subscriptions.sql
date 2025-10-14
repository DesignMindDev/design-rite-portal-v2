-- Update handle_new_user trigger to give employees unlimited assessments
-- Employees (super_admin, admin, manager, developer, contractor) get 'employee' tier
-- Regular users get 'trial' tier with limited assessments

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_record RECORD;
  subscription_tier TEXT;
  assessment_limit INT;
  ai_generation_limit INT;
BEGIN
  -- Step 1: Create profile
  INSERT INTO public.profiles (id, email, full_name, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  );

  -- Step 2: Create user role (default to 'user')
  INSERT INTO public.user_roles (user_id, role, domain_override)
  VALUES (NEW.id, 'user', FALSE)
  RETURNING * INTO user_role_record;

  -- Step 3: Determine subscription tier based on role
  -- Note: This runs BEFORE the API updates the role, so we check again later
  -- For now, create trial subscription and let API handle employee upgrades
  IF user_role_record.role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor') THEN
    subscription_tier := 'employee';
    assessment_limit := 9999;
    ai_generation_limit := 9999;
  ELSE
    subscription_tier := 'trial';
    assessment_limit := 3;
    ai_generation_limit := 100;
  END IF;

  -- Step 4: Create subscription
  INSERT INTO public.subscriptions (
    user_id,
    tier,
    status,
    assessment_limit,
    ai_generation_limit,
    assessments_used,
    trial_start,
    trial_end,
    source
  )
  VALUES (
    NEW.id,
    subscription_tier,
    CASE
      WHEN subscription_tier = 'employee' THEN 'active'
      ELSE 'trialing'
    END,
    assessment_limit,
    ai_generation_limit,
    0,
    NOW(),
    CASE
      WHEN subscription_tier = 'employee' THEN NULL
      ELSE NOW() + INTERVAL '14 days'
    END,
    'manual'
  );

  RETURN NEW;
END;
$$;

-- Create a function to upgrade user to employee subscription when role changes
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If role changed to an employee role, upgrade subscription
  IF NEW.role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor')
     AND OLD.role NOT IN ('super_admin', 'admin', 'manager', 'developer', 'contractor') THEN

    UPDATE public.subscriptions
    SET
      tier = 'employee',
      status = 'active',
      assessment_limit = 9999,
      ai_generation_limit = 9999,
      trial_end = NULL,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RAISE NOTICE 'Upgraded user % to employee subscription', NEW.user_id;
  END IF;

  -- If role changed from employee to regular user, downgrade to trial
  IF OLD.role IN ('super_admin', 'admin', 'manager', 'developer', 'contractor')
     AND NEW.role NOT IN ('super_admin', 'admin', 'manager', 'developer', 'contractor') THEN

    UPDATE public.subscriptions
    SET
      tier = 'trial',
      status = 'trialing',
      assessment_limit = 3,
      ai_generation_limit = 100,
      trial_start = NOW(),
      trial_end = NOW() + INTERVAL '14 days',
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RAISE NOTICE 'Downgraded user % to trial subscription', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;

-- Create trigger for role changes
CREATE TRIGGER on_user_role_change
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.handle_role_change();

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile, role, and subscription for new users. Employees get unlimited access.';
COMMENT ON FUNCTION public.handle_role_change() IS 'Automatically upgrades/downgrades subscription when user role changes.';
