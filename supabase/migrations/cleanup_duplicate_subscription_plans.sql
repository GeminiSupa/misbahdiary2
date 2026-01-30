-- Cleanup duplicate subscription plans
-- This migration removes duplicate "Professional Plan" entries, keeping only the best one

-- Step 1: Identify the best plan to keep and update all firms to use it
-- Priority: 
-- 1. Plan with both price_id_stripe and price_id_stripe_yearly set
-- 2. Most recently created plan
-- 3. Plan with any Stripe configuration
DO $$
DECLARE
  plan_to_keep_id UUID;
  duplicate_count INTEGER;
BEGIN
  -- Count duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM public.subscription_plans
  WHERE name = 'Professional Plan' AND is_active = true;
  
  IF duplicate_count > 1 THEN
    -- Find the best plan to keep
    -- Priority: Has both Stripe price IDs > Has any Stripe price ID > Most recent
    SELECT id INTO plan_to_keep_id
    FROM public.subscription_plans
    WHERE name = 'Professional Plan' 
      AND is_active = true
    ORDER BY 
      -- First priority: Has both price_id_stripe and price_id_stripe_yearly
      CASE 
        WHEN price_id_stripe IS NOT NULL AND price_id_stripe_yearly IS NOT NULL THEN 1
        WHEN price_id_stripe IS NOT NULL OR price_id_stripe_yearly IS NOT NULL THEN 2
        ELSE 3
      END,
      -- Second priority: Most recently created
      created_at DESC
    LIMIT 1;
    
    -- Step 2: Update all firms that reference duplicate plans to use the kept plan
    UPDATE public.firms
    SET subscription_plan_id = plan_to_keep_id
    WHERE subscription_plan_id IN (
      SELECT id 
      FROM public.subscription_plans 
      WHERE name = 'Professional Plan' 
        AND is_active = true
        AND id != plan_to_keep_id
    );
    
    -- Step 3: Now safe to delete all other duplicate plans (firms have been updated)
    DELETE FROM public.subscription_plans
    WHERE name = 'Professional Plan' 
      AND is_active = true
      AND id != plan_to_keep_id;
    
    RAISE NOTICE 'Kept plan ID: %, Updated firms and deleted % duplicate(s)', plan_to_keep_id, duplicate_count - 1;
  ELSE
    RAISE NOTICE 'No duplicates found or only one plan exists';
  END IF;
END $$;

-- Step 4: Add a unique constraint to prevent future duplicates
-- Only allow one active plan with the same name
CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_unique_active_name 
ON public.subscription_plans (name) 
WHERE is_active = true;

-- Add a comment explaining the constraint
COMMENT ON INDEX subscription_plans_unique_active_name IS 
'Ensures only one active subscription plan can exist with the same name';
