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
      if (process.env.NODE_ENV === "development") {
        console.warn("Subscription columns may not exist yet. Returning default trial status.");
      }
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

  // Type assertion: firm should have the subscription fields
  type FirmWithSubscription = {
    subscription_status: string | null;
    subscription_plan_id: string | null;
    trial_started_at: string | null;
    trial_ends_at: string | null;
    subscription_started_at: string | null;
    subscription_ends_at: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  };

  const firmData = firm as FirmWithSubscription;

  const now = new Date();
  const trialEndsAt = firmData.trial_ends_at ? new Date(firmData.trial_ends_at) : null;
  const subscriptionEndsAt = firmData.subscription_ends_at
    ? new Date(firmData.subscription_ends_at)
    : null;

  // Calculate days remaining in trial
  let daysRemainingInTrial: number | null = null;
  if (firmData.subscription_status === "trial") {
    if (trialEndsAt) {
      const diffTime = trialEndsAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemainingInTrial = diffDays > 0 ? diffDays : 0;
    } else if (firmData.trial_started_at) {
      // If trial_ends_at is missing but trial_started_at exists, calculate from start date
      const trialStartedAt = new Date(firmData.trial_started_at);
      const calculatedTrialEndsAt = new Date(trialStartedAt);
      calculatedTrialEndsAt.setDate(calculatedTrialEndsAt.getDate() + 30);
      const diffTime = calculatedTrialEndsAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemainingInTrial = diffDays > 0 ? diffDays : 0;
    }
  }

  // Check if trial is active (status is trial and hasn't expired)
  // If trial_ends_at is null but status is trial, assume trial is active if it started recently
  let isTrialActive = false;
  if (firmData.subscription_status === "trial") {
    if (trialEndsAt) {
      isTrialActive = trialEndsAt > now;
    } else if (firmData.trial_started_at) {
      // Calculate trial end from start date if end date is missing
      const trialStartedAt = new Date(firmData.trial_started_at);
      const calculatedTrialEndsAt = new Date(trialStartedAt);
      calculatedTrialEndsAt.setDate(calculatedTrialEndsAt.getDate() + 30);
      isTrialActive = calculatedTrialEndsAt > now;
    } else {
      // If no dates at all but status is trial, assume active (will be fixed by migration)
      isTrialActive = true;
    }
  }

  // Check if subscription is active (status is active and hasn't expired)
  // For one-time payments, subscription_ends_at is set to 30 days from payment
  const isSubscriptionActive =
    firmData.subscription_status === "active" &&
    subscriptionEndsAt !== null &&
    subscriptionEndsAt > now;

  // Handle edge case: trial ended but subscription not started
  // If trial expired and no active subscription, status should be expired
  let actualStatus = (firmData.subscription_status || "trial") as FirmSubscription["status"];
  if (
    firmData.subscription_status === "trial" &&
    trialEndsAt !== null &&
    trialEndsAt <= now &&
    !isSubscriptionActive
  ) {
    actualStatus = "expired";
  }

  // Calculate trial_ends_at if missing but trial_started_at exists
  let calculatedTrialEndsAt: string | null = firmData.trial_ends_at;
  if (!calculatedTrialEndsAt && firmData.trial_started_at && firmData.subscription_status === "trial") {
    const trialStartedAt = new Date(firmData.trial_started_at);
    const trialEnds = new Date(trialStartedAt);
    trialEnds.setDate(trialEnds.getDate() + 30);
    calculatedTrialEndsAt = trialEnds.toISOString();
  }

  return {
    status: actualStatus,
    plan_id: firmData.subscription_plan_id,
    trial_started_at: firmData.trial_started_at,
    trial_ends_at: calculatedTrialEndsAt,
    subscription_started_at: firmData.subscription_started_at,
    subscription_ends_at: firmData.subscription_ends_at,
    stripe_customer_id: firmData.stripe_customer_id,
    stripe_subscription_id: firmData.stripe_subscription_id,
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
  billingInterval: "monthly" | "yearly" = "monthly",
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
    const { data: planData, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, name, price_id_stripe, price_id_stripe_yearly, product_id_stripe, price_monthly, price_yearly")
      .eq("id", firm.subscription_plan_id)
      .eq("is_active", true)
      .single();
    
    if (planError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching plan by ID:", {
          code: planError.code,
          message: planError.message,
          details: planError.details,
          hint: planError.hint,
        });
      }
    } else if (planData) {
      plan = planData;
    }
  }

  // If no plan found, get the default Professional Plan
  // Note: There might be multiple "Professional Plan" entries, so we get the first one
  if (!plan) {
    const { data: defaultPlans, error: defaultPlanError } = await supabase
      .from("subscription_plans")
      .select("id, name, price_id_stripe, price_id_stripe_yearly, product_id_stripe, price_monthly, price_yearly")
      .eq("name", "Professional Plan")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);
    
    const defaultPlan = defaultPlans && defaultPlans.length > 0 ? defaultPlans[0] : null;
    
    if (defaultPlanError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching default plan:", {
          code: defaultPlanError.code,
          message: defaultPlanError.message,
          details: defaultPlanError.details,
          hint: defaultPlanError.hint,
          fullError: defaultPlanError,
        });
      }
    } else if (defaultPlan) {
      plan = defaultPlan;
    } else {
      // No error but also no data - likely RLS policy blocking access
      if (process.env.NODE_ENV === "development") {
        console.warn("No default plan found and no error returned. This might indicate an RLS policy issue.");
      }
    }
  }

  if (!plan) {
    if (process.env.NODE_ENV === "development") {
      console.error("No subscription plan found. This might be an RLS policy issue or the plan doesn't exist.");
      // Try to check if we can access the table at all
      const { data: allPlans, error: allPlansError } = await supabase
        .from("subscription_plans")
        .select("id, name, is_active")
        .limit(5);
      if (allPlansError) {
        console.error("Cannot access subscription_plans table:", {
          code: allPlansError.code,
          message: allPlansError.message,
          details: allPlansError.details,
          hint: allPlansError.hint,
        });
      } else {
        console.error("Available plans:", allPlans);
      }
    }
    return { message: "Subscription plan not found. Please contact support at /contact or email info@ux4u.online for assistance." };
  }

  // Check if Stripe is configured
  if (!stripe) {
    if (process.env.NODE_ENV === "development") {
      console.error("Stripe client is not initialized. Check STRIPE_SECRET_KEY environment variable.");
    }
    return {
      message: "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.",
    };
  }

  // Select the correct Stripe price ID based on billing interval
  const stripePriceId = billingInterval === "yearly"
    ? plan.price_id_stripe_yearly
    : plan.price_id_stripe;

  if (!stripePriceId) {
    const missingField = billingInterval === "yearly" ? "price_id_stripe_yearly" : "price_id_stripe";
    if (process.env.NODE_ENV === "development") {
      console.error(`Plan missing ${missingField}:`, { planId: plan.id, planName: plan.name, billingInterval });
    }
    return {
      message:
        `Subscription plan is not configured with Stripe ${billingInterval === "yearly" ? "Yearly" : "Monthly"} Price ID. Please contact support at /contact or email info@ux4u.online for assistance.`,
    };
  }

  if (!plan.product_id_stripe) {
    if (process.env.NODE_ENV === "development") {
      console.error("Plan missing product_id_stripe:", { planId: plan.id, planName: plan.name });
    }
    return {
      message:
        "Subscription plan product ID is missing. Please contact support at /contact or email info@ux4u.online for assistance.",
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
    // The price is a recurring subscription price (monthly or yearly based on billingInterval)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription", // Recurring subscription mode
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription?canceled=true`,
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

    return { url: session.url || undefined };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating checkout session:", error);
      // Log detailed error for debugging
      if (error instanceof Error && "type" in error) {
        console.error("Stripe error details:", {
          type: (error as { type?: string }).type,
          message: error.message,
          code: (error as { code?: string }).code,
        });
      }
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    
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

  // Check if Stripe is configured
  if (!stripe) {
    return {
      message: "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.",
    };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: firm.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription`,
    });

    return { url: session.url || undefined };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating portal session:", error);
    }
    return {
      error:
        error instanceof Error ? error.message : "Failed to create portal session",
    };
  }
}
