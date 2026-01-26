-- Set default subscription plan for firms that don't have one
-- This ensures all firms have a subscription plan assigned

UPDATE public.firms
SET subscription_plan_id = (
  SELECT id FROM public.subscription_plans 
  WHERE name = 'Professional Plan' 
  AND is_active = true 
  LIMIT 1
)
WHERE subscription_plan_id IS NULL;
