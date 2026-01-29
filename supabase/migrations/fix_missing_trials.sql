-- Fix firms that don't have trial dates set
-- This migration ensures all firms have a proper 15-day trial period

-- Update firms that don't have trial_started_at or trial_ends_at
-- Set trial_started_at to created_at (or now if created_at is null)
-- Set trial_ends_at to 15 days after trial_started_at
UPDATE public.firms
SET 
  subscription_status = COALESCE(subscription_status, 'trial'),
  trial_started_at = COALESCE(trial_started_at, COALESCE(created_at, NOW())),
  trial_ends_at = COALESCE(
    trial_ends_at,
    (COALESCE(trial_started_at, COALESCE(created_at, NOW())) + INTERVAL '15 days')
  )
WHERE 
  trial_started_at IS NULL 
  OR trial_ends_at IS NULL
  OR subscription_status IS NULL;

-- Set default subscription plan for firms that don't have one
UPDATE public.firms
SET subscription_plan_id = (
  SELECT id FROM public.subscription_plans 
  WHERE name = 'Professional Plan' 
  AND is_active = true 
  LIMIT 1
)
WHERE subscription_plan_id IS NULL;
