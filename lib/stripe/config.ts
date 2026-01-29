import Stripe from "stripe";

// Check if Stripe is configured
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY is not set in environment variables. Stripe features will not work.");
}

// Create Stripe client only if key is available
// This prevents the app from crashing if Stripe is not configured
export const stripe: Stripe | null = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    })
  : null;

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Helper to check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!STRIPE_SECRET_KEY && !!STRIPE_PUBLISHABLE_KEY;
};
