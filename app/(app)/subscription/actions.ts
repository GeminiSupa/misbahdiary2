"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";
import type {
  CheckoutSessionResponse,
  PortalSessionResponse,
  FirmSubscription,
} from "@/lib/stripe/types";

type ActionState = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

/**
 * Get subscription status for a firm
 */
export async function getSubscriptionStatus(
  firmId: string,
): Promise<FirmSubscription | ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  // Verify user belongs to this firm
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .eq("firm_id", firmId)
    .maybeSingle();

  if (!profile) {
    return { message: "Access denied. You don't belong to this firm." };
  }

  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .select(
      "subscription_status, subscription_plan_id, trial_started_at, trial_ends_at, subscription_started_at, subscription_ends_at, stripe_customer_id, stripe_subscription_id",
    )
    .eq("id", firmId)
    .single();

  if (firmError || !firm) {
    // If columns don't exist yet (migration not run), return default trial status
    if (firmError?.code === "42703" || firmError?.message?.includes("column") || firmError?.message?.includes("does not exist")) {
      console.warn("Subscription columns may not exist yet. Returning default trial status.");
      return {
        status: "trial" as const,
        plan_id: null,
        trial_started_at: null,
        trial_ends_at: null,
        subscription_started_at: null,
        subscription_ends_at: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        days_remaining_in_trial: null,
        is_trial_active: true,
        is_subscription_active: false,
      };
    }
    return { message: "Firm not found." };
  }

  const now = new Date();
  const trialEndsAt = firm.trial_ends_at ? new Date(firm.trial_ends_at) : null;
  const subscriptionEndsAt = firm.subscription_ends_at
    ? new Date(firm.subscription_ends_at)
    : null;

  // Calculate days remaining in trial
  let daysRemainingInTrial: number | null = null;
  if (trialEndsAt && firm.subscription_status === "trial") {
    const diffTime = trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysRemainingInTrial = diffDays > 0 ? diffDays : 0;
  }

  // Check if trial is active (status is trial and hasn't expired)
  const isTrialActive =
    firm.subscription_status === "trial" &&
    trialEndsAt !== null &&
    trialEndsAt > now;

  // Check if subscription is active (status is active and hasn't expired)
  // For one-time payments, subscription_ends_at is set to 30 days from payment
  const isSubscriptionActive =
    firm.subscription_status === "active" &&
    subscriptionEndsAt !== null &&
    subscriptionEndsAt > now;

  // Handle edge case: trial ended but subscription not started
  // If trial expired and no active subscription, status should be expired
  let actualStatus = firm.subscription_status as FirmSubscription["status"];
  if (
    firm.subscription_status === "trial" &&
    trialEndsAt !== null &&
    trialEndsAt <= now &&
    !isSubscriptionActive
  ) {
    actualStatus = "expired";
  }

  return {
    status: actualStatus,
    plan_id: firm.subscription_plan_id,
    trial_started_at: firm.trial_started_at,
    trial_ends_at: firm.trial_ends_at,
    subscription_started_at: firm.subscription_started_at,
    subscription_ends_at: firm.subscription_ends_at,
    stripe_customer_id: firm.stripe_customer_id,
    stripe_subscription_id: firm.stripe_subscription_id,
    days_remaining_in_trial: daysRemainingInTrial,
    is_trial_active: isTrialActive,
    is_subscription_active: isSubscriptionActive,
  };
}

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  firmId: string,
): Promise<CheckoutSessionResponse | ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  // Verify user is firm owner
  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .select("id, owner_id, subscription_plan_id, stripe_customer_id, name, contact_email")
    .eq("id", firmId)
    .single();

  if (firmError || !firm) {
    return { message: "Firm not found." };
  }

  if (firm.owner_id !== user.id) {
    return { message: "Only the firm owner can create a subscription." };
  }

  // Get subscription plan - try firm's plan first, then default
  let plan = null;
  if (firm.subscription_plan_id) {
    const { data: planData } = await supabase
      .from("subscription_plans")
      .select("id, price_id_stripe, product_id_stripe, price_monthly")
      .eq("id", firm.subscription_plan_id)
      .single();
    plan = planData;
  }

  // If no plan found, get the default Professional Plan
  if (!plan) {
    const { data: defaultPlan } = await supabase
      .from("subscription_plans")
      .select("id, price_id_stripe, product_id_stripe, price_monthly")
      .eq("name", "Professional Plan")
      .eq("is_active", true)
      .maybeSingle();
    plan = defaultPlan;
  }

  if (!plan) {
    console.error("No subscription plan found");
    return { message: "Subscription plan not found. Please contact support." };
  }

  if (!plan.price_id_stripe) {
    return {
      message:
        "Subscription plan is not configured with Stripe. Please contact support.",
    };
  }

  if (!plan.product_id_stripe) {
    return {
      message:
        "Subscription plan product ID is missing. Please contact support.",
    };
  }

  try {
    // Create or retrieve Stripe customer
    let customerId = firm.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: firm.contact_email || user.email || undefined,
        name: firm.name,
        metadata: {
          firm_id: firmId,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID to firm
      await supabase
        .from("firms")
        .update({ stripe_customer_id: customerId })
        .eq("id", firmId);
    }

    // Create checkout session for recurring subscription
    // The price is a recurring subscription price
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.price_id_stripe,
          quantity: 1,
        },
      ],
      mode: "subscription", // Recurring subscription mode
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription?canceled=true`,
      metadata: {
        firm_id: firmId,
        user_id: user.id,
        plan_id: plan.id,
      },
      subscription_data: {
        metadata: {
          firm_id: firmId,
          user_id: user.id,
          plan_id: plan.id,
        },
      },
    });

    return { url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    
    // Log detailed error for debugging
    if (error instanceof Error && "type" in error) {
      console.error("Stripe error details:", {
        type: (error as { type?: string }).type,
        message: error.message,
        code: (error as { code?: string }).code,
      });
    }
    
    return {
      error: errorMessage,
    };
  }
}

/**
 * Create Stripe customer portal session
 */
export async function createPortalSession(
  firmId: string,
): Promise<PortalSessionResponse | ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  // Verify user is firm owner
  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .select("id, owner_id, stripe_customer_id")
    .eq("id", firmId)
    .single();

  if (firmError || !firm) {
    return { message: "Firm not found." };
  }

  if (firm.owner_id !== user.id) {
    return { message: "Only the firm owner can access the customer portal." };
  }

  if (!firm.stripe_customer_id) {
    return {
      message: "No Stripe customer found. Please subscribe first.",
    };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: firm.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription`,
    });

    return { url: session.url };
  } catch (error) {
    console.error("Error creating portal session:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to create portal session",
    };
  }
}
