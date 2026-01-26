-- Update Professional Plan with Stripe Product and Price IDs
-- This migration updates the default plan with the provided Stripe IDs

UPDATE public.subscription_plans 
SET 
  product_id_stripe = 'prod_TrfouSosUid0qc',
  price_id_stripe = 'price_1StwT024eTlheQnEVsBlAbG1'
WHERE name = 'Professional Plan';
