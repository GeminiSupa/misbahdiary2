-- Subscription System Migration
-- Adds subscription management tables and columns for Stripe payment system

-- Subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_id_stripe TEXT, -- Stripe Price ID
  product_id_stripe TEXT, -- Stripe Product ID
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default Professional Plan (500 PKR/month = ~$1.80/month, but we'll use $2 for simplicity)
-- Note: Update price_id_stripe after creating product in Stripe
INSERT INTO public.subscription_plans (name, price_monthly, features)
VALUES (
  'Professional Plan',
  500.00,
  '{"features": ["Unlimited cases", "Unlimited clients", "Team management", "Document storage", "Billing & invoicing", "Calendar management"]}'
)
ON CONFLICT DO NOTHING;

-- Add subscription columns to firms table
ALTER TABLE public.firms
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial', -- trial, active, past_due, canceled, expired
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Subscription history/audit log
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL, -- trial_started, trial_ended, subscribed, canceled, expired, payment_received
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  amount_paid DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  payment_method TEXT, -- stripe, easypaisa, bank_transfer, etc.
  payment_reference TEXT, -- transaction ID, receipt number, etc.
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS firms_subscription_status_idx ON public.firms(subscription_status);
CREATE INDEX IF NOT EXISTS firms_trial_ends_at_idx ON public.firms(trial_ends_at);
CREATE INDEX IF NOT EXISTS firms_subscription_ends_at_idx ON public.firms(subscription_ends_at);
CREATE INDEX IF NOT EXISTS firms_stripe_customer_id_idx ON public.firms(stripe_customer_id);
CREATE INDEX IF NOT EXISTS firms_stripe_subscription_id_idx ON public.firms(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscription_history_firm_id_idx ON public.subscription_history(firm_id);
CREATE INDEX IF NOT EXISTS subscription_history_created_at_idx ON public.subscription_history(created_at);

-- RLS Policies

-- Subscription plans: readable by all authenticated users
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Subscription history: only firm members can view
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Firm members can view subscription history" ON public.subscription_history;
CREATE POLICY "Firm members can view subscription history"
  ON public.subscription_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.firm_id = subscription_history.firm_id
      AND profiles.id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans for firms';
COMMENT ON TABLE public.subscription_history IS 'Audit log of subscription events and status changes';
COMMENT ON COLUMN public.firms.subscription_status IS 'Current subscription status: trial, active, past_due, canceled, expired';
COMMENT ON COLUMN public.firms.trial_ends_at IS 'End date of the 15-day free trial period';
COMMENT ON COLUMN public.firms.subscription_ends_at IS 'End date of the current subscription period';
COMMENT ON COLUMN public.firms.stripe_customer_id IS 'Stripe customer ID for this firm';
COMMENT ON COLUMN public.firms.stripe_subscription_id IS 'Stripe subscription ID for this firm';
COMMENT ON COLUMN public.subscription_plans.product_id_stripe IS 'Stripe Product ID';