-- Add product_id_stripe column to subscription_plans table
-- This migration adds the missing product_id_stripe column

ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS product_id_stripe TEXT;

COMMENT ON COLUMN public.subscription_plans.product_id_stripe IS 'Stripe Product ID';
