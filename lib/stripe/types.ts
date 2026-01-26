export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "trialing";

export type SubscriptionPlan = {
  id: string;
  name: string;
  price_monthly: number;
  price_id_stripe?: string | null;
  product_id_stripe?: string | null;
  features: unknown;
};

export type FirmSubscription = {
  status: SubscriptionStatus;
  plan_id: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  days_remaining_in_trial: number | null;
  is_trial_active: boolean;
  is_subscription_active: boolean;
};

export type CheckoutSessionResponse = {
  url?: string;
  error?: string;
};

export type PortalSessionResponse = {
  url?: string;
  error?: string;
};
