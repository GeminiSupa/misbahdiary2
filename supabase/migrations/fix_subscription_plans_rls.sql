-- Fix RLS policy for subscription_plans to ensure all authenticated users can access active plans
-- This fixes the issue where new accounts can't see subscription plans

-- Drop all existing policies on subscription_plans to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can view active subscription plans" ON public.subscription_plans;

-- Create a more explicit policy that ensures authenticated users can view active plans
-- Using auth.uid() IS NOT NULL ensures the user is authenticated
CREATE POLICY "Authenticated users can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND is_active = true
  );
