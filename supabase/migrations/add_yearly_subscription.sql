-- Add Yearly Subscription Support
-- Adds columns to subscription_plans table for yearly billing option

ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_id_stripe_yearly TEXT;

-- Update Professional Plan with yearly pricing (4999 PKR/year)
-- Note: price_id_stripe_yearly should be updated after creating the yearly price in Stripe
UPDATE public.subscription_plans
SET 
  price_yearly = 4999.00,
  price_id_stripe_yearly = NULL -- To be updated after Stripe setup
WHERE name = 'Professional Plan';

-- Add comment for documentation
COMMENT ON COLUMN public.subscription_plans.price_yearly IS 'Yearly subscription price in PKR';
COMMENT ON COLUMN public.subscription_plans.price_id_stripe_yearly IS 'Stripe Price ID for yearly recurring subscription';
