-- Update Professional Plan with Yearly Stripe Price ID
-- This migration updates the yearly Stripe price ID after creating it in Stripe Dashboard

UPDATE public.subscription_plans
SET price_id_stripe_yearly = 'price_1SupCg24eTlheQnExU4tEmjh'
WHERE name = 'Professional Plan';

-- Verify the update
SELECT 
  id, 
  name, 
  price_monthly, 
  price_yearly, 
  price_id_stripe, 
  price_id_stripe_yearly,
  product_id_stripe
FROM public.subscription_plans
WHERE name = 'Professional Plan';
