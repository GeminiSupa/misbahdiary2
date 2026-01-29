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
      "subscription_status, trial_started_at, trial_ends_at, subscription_ends_at",
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
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    subscription_ends_at?: string | null;
  };

  const firmData = firm as FirmWithSubscription;

  const now = new Date();
  
  // Calculate trial_ends_at if missing but trial_started_at exists
  let trialEndsAt: Date | null = null;
  if (firmData.trial_ends_at) {
    trialEndsAt = new Date(firmData.trial_ends_at);
  } else if (firmData.trial_started_at && firmData.subscription_status === "trial") {
    // Calculate trial end from start date (15 days)
    const trialStartedAt = new Date(firmData.trial_started_at);
    trialEndsAt = new Date(trialStartedAt);
    trialEndsAt.setDate(trialEndsAt.getDate() + 15);
  }
  
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
  // Trial is active only if: status is "trial" AND trial hasn't expired
  let isTrialActive = false;
  if (subscriptionStatus === "trial") {
    if (trialEndsAt) {
      isTrialActive = trialEndsAt > now;
    } else {
      // If trial_ends_at is missing but status is "trial", check if we can calculate it
      // For now, if trial_ends_at is null, we'll treat it as potentially expired
      // This is a safety measure - firms should have trial_ends_at set
      isTrialActive = false; // No trial end date = assume expired for safety
    }
  }

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
    if (subscriptionStatus === "trial") {
      if (trialEndsAt && trialEndsAt <= now) {
        actualStatus = "expired"; // Trial expired (has end date and it passed)
      } else if (!trialEndsAt) {
        actualStatus = "expired"; // Trial expired (no end date = assume expired for safety)
      } else {
        actualStatus = "expired"; // Trial not active = expired
      }
    } else if (subscriptionStatus === "active" && subscriptionEndsAt && subscriptionEndsAt <= now) {
      actualStatus = "expired"; // Subscription expired (one-time payment period ended)
    } else if (subscriptionStatus === "canceled") {
      actualStatus = "expired"; // Canceled subscriptions are treated as expired
    } else if (subscriptionStatus === "past_due") {
      // Past due subscriptions = no access, block everything
      actualStatus = "expired";
    } else {
      // Any other status without access = expired
      actualStatus = "expired";
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
    trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
    subscriptionEndsAt: firmData.subscription_ends_at || null,
    message,
  };
}

/**
 * Check if user has access to the application
 * Returns true if access is granted, false if blocked
 */
export async function requireSubscriptionAccess(firmId: string): Promise<boolean> {
  const check = await checkSubscriptionAccess(firmId);
  return check.hasAccess;
}

/**
 * Check subscription and redirect to subscription page if expired
 * Use this in page components as a backup to middleware
 */
export async function enforceSubscriptionAccess(firmId: string): Promise<void> {
  const check = await checkSubscriptionAccess(firmId);
  if (!check.hasAccess) {
    const { redirect } = await import("next/navigation");
    redirect("/subscription?expired=true");
  }
}
