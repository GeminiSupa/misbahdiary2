import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SubscriptionCheckResult = {
  hasAccess: boolean;
  status: string;
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
  daysRemainingInTrial: number | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  message?: string;
};

/**
 * Check if a firm has active subscription or valid trial
 * Returns access status and subscription information
 */
export async function checkSubscriptionAccess(
  firmId: string,
): Promise<SubscriptionCheckResult> {
  const supabase = await createSupabaseServerClient();

  const { data: firm, error } = await supabase
    .from("firms")
    .select(
      "subscription_status, trial_ends_at, subscription_ends_at",
    )
    .eq("id", firmId)
    .single();

  if (error || !firm) {
    // If columns don't exist yet (migration not run), allow access
    if (error?.code === "42703" || error?.message?.includes("column") || error?.message?.includes("does not exist")) {
      console.warn("Subscription columns may not exist yet. Allowing access.");
      return {
        hasAccess: true,
        status: "trial",
        isTrialActive: true,
        isSubscriptionActive: false,
        daysRemainingInTrial: null,
        trialEndsAt: null,
        subscriptionEndsAt: null,
        message: "Subscription system not yet configured",
      };
    }
    return {
      hasAccess: false,
      status: "unknown",
      isTrialActive: false,
      isSubscriptionActive: false,
      daysRemainingInTrial: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      message: "Firm not found",
    };
  }

  // Type assertion: firm should have the subscription fields
  type FirmWithSubscription = {
    subscription_status?: string | null;
    trial_ends_at?: string | null;
    subscription_ends_at?: string | null;
  };

  const firmData = firm as FirmWithSubscription;

  const now = new Date();
  const trialEndsAt = firmData.trial_ends_at ? new Date(firmData.trial_ends_at) : null;
  const subscriptionEndsAt = firmData.subscription_ends_at
    ? new Date(firmData.subscription_ends_at)
    : null;

  // If subscription_status is null/undefined, allow access (migration not run or firm created before subscription system)
  const subscriptionStatus = firmData.subscription_status;
  if (!subscriptionStatus) {
    return {
      hasAccess: true,
      status: "trial",
      isTrialActive: true,
      isSubscriptionActive: false,
      daysRemainingInTrial: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      message: "Subscription system not yet configured",
    };
  }

  // Check trial status
  const isTrialActive = Boolean(
    subscriptionStatus === "trial" &&
    trialEndsAt &&
    trialEndsAt > now
  );

  // Check subscription status
  const isSubscriptionActive = Boolean(
    subscriptionStatus === "active" &&
    subscriptionEndsAt &&
    subscriptionEndsAt > now
  );

  // Calculate days remaining in trial
  let daysRemainingInTrial: number | null = null;
  if (isTrialActive && trialEndsAt) {
    const diffTime = trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysRemainingInTrial = diffDays > 0 ? diffDays : 0;
  }

  // Determine access
  const hasAccess = isTrialActive || isSubscriptionActive;

  // Determine actual status (update to "expired" if trial/subscription expired)
  let actualStatus = subscriptionStatus;
  if (!hasAccess) {
    if (subscriptionStatus === "trial" && trialEndsAt && trialEndsAt <= now) {
      actualStatus = "expired"; // Trial expired
    } else if (subscriptionStatus === "active" && subscriptionEndsAt && subscriptionEndsAt <= now) {
      actualStatus = "expired"; // Subscription expired (one-time payment period ended)
    } else if (subscriptionStatus === "canceled") {
      actualStatus = "expired"; // Canceled subscriptions are treated as expired
    }
  }

  let message: string | undefined;
  if (!hasAccess) {
    if (subscriptionStatus === "trial" && trialEndsAt && trialEndsAt <= now) {
      message = "Your free trial has expired. Please pay PKR 500 per month to continue.";
    } else if (subscriptionStatus === "expired" || actualStatus === "expired") {
      message = "Your subscription has expired. Please pay PKR 500 per month to continue.";
    } else {
      message = "No active subscription or trial.";
    }
  }

  return {
    hasAccess,
    status: actualStatus || "unknown",
    isTrialActive,
    isSubscriptionActive,
    daysRemainingInTrial,
    trialEndsAt: firmData.trial_ends_at || null,
    subscriptionEndsAt: firmData.subscription_ends_at || null,
    message,
  };
}

/**
 * Check if user has access to the application
 * Redirects to subscription page if access is denied
 */
export async function requireSubscriptionAccess(firmId: string): Promise<boolean> {
  const check = await checkSubscriptionAccess(firmId);
  return check.hasAccess;
}
