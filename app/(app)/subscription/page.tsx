import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/app/(app)/subscription/actions";
import { SubscriptionStatus } from "@/components/subscription/subscription-status";
import { TrialBanner } from "@/components/subscription/trial-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubscriptionManagement } from "@/components/subscription/subscription-management";
import { SubscriptionHistory } from "@/components/subscription/subscription-history";
import { SubscriptionGuide } from "@/components/subscription/subscription-guide";
import type { FirmSubscription } from "@/lib/stripe/types";

export const metadata = {
  title: "Subscription • Lawyer Diary",
};

export default async function SubscriptionPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    redirect("/onboarding");
  }

  // Get firm details to check if user is owner
  const { data: firm } = await supabase
    .from("firms")
    .select("id, owner_id, name")
    .eq("id", profile.firm_id)
    .single();

  if (!firm) {
    redirect("/dashboard");
  }

  const isOwner = firm.owner_id === user.id;

  // Get subscription status
  const subscriptionResult = await getSubscriptionStatus(profile.firm_id);

  if ("message" in subscriptionResult) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing
          </p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-destructive font-medium">{subscriptionResult.message}</p>
              <p className="text-sm text-muted-foreground">
                If you continue to experience issues, please contact our support team.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button asChild variant="default" className="flex-1 sm:flex-none">
                <a href="/contact">Contact Support</a>
              </Button>
              <Button asChild variant="outline" className="flex-1 sm:flex-none">
                <a href="mailto:info@ux4u.online" target="_blank" rel="noopener noreferrer">
                  Email: info@ux4u.online
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscription = subscriptionResult as FirmSubscription;

  // Get subscription plan details
  // If plan_id is null, get the default Professional Plan
  let plan = null;
  if (subscription.plan_id) {
    const { data: planData, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, name, price_monthly, price_yearly, features, price_id_stripe, price_id_stripe_yearly, product_id_stripe")
      .eq("id", subscription.plan_id)
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
      .select("id, name, price_monthly, price_yearly, features, price_id_stripe, price_id_stripe_yearly, product_id_stripe")
      .eq("name", "Professional Plan")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);
    
    const defaultPlan = defaultPlans && defaultPlans.length > 0 ? defaultPlans[0] : null;
    
    // Check for error (including empty error object {} which indicates RLS blocking)
    // Empty error object {} usually means RLS is blocking access
    const hasProperError = defaultPlanError && Object.keys(defaultPlanError).length > 0;
    const hasEmptyError = defaultPlanError && Object.keys(defaultPlanError).length === 0;
    const isBlockedByRLS = !defaultPlan && (hasEmptyError || (!hasProperError && !defaultPlanError));
    
    if (hasProperError || isBlockedByRLS) {
      if (process.env.NODE_ENV === "development") {
        // Get user info for diagnostics
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        console.error("Error fetching default plan:", {
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          hasError: !!defaultPlanError,
          isEmptyError: hasEmptyError,
          errorType: typeof defaultPlanError,
          errorKeys: defaultPlanError ? Object.keys(defaultPlanError) : [],
          errorStringified: JSON.stringify(defaultPlanError),
          code: defaultPlanError?.code,
          message: defaultPlanError?.message,
          details: defaultPlanError?.details,
          hint: defaultPlanError?.hint,
          fullError: defaultPlanError,
          hasData: !!defaultPlan,
          dataValue: defaultPlan,
          likelyRLSBlock: isBlockedByRLS,
        });
        
        // Try a diagnostic query to see if RLS is blocking
        const { data: testPlans, error: testError } = await supabase
          .from("subscription_plans")
          .select("id, name, is_active")
          .limit(1);
        
        console.error("RLS Diagnostic - Can access subscription_plans?", {
          userId: currentUser?.id,
          hasData: !!testPlans,
          dataCount: testPlans?.length || 0,
          dataValue: testPlans,
          hasError: !!testError,
          errorType: typeof testError,
          errorKeys: testError ? Object.keys(testError) : [],
          errorStringified: JSON.stringify(testError),
          error: testError,
        });
      }
    }
    
    if (defaultPlan) {
      plan = defaultPlan;
    } else if (!hasProperError && !isBlockedByRLS) {
      // No error but also no data - might be RLS or plan doesn't exist
      if (process.env.NODE_ENV === "development") {
        console.warn("No default plan found and no error returned. This might indicate an RLS policy issue or the plan doesn't exist.");
      }
    }
  }

  // Fallback plan if no plan is found in database
  // This ensures the component always has a plan object
  if (!plan) {
    plan = {
      id: "default",
      name: "Professional Plan",
      price_monthly: 500.00,
      price_yearly: 4999.00,
      price_id_stripe: null,
      price_id_stripe_yearly: null,
      product_id_stripe: null,
      features: {
        features: [
          "Unlimited cases",
          "Unlimited clients",
          "Team management",
          "Document storage",
          "Billing & invoicing",
          "Calendar management",
        ],
      },
    };
  }

  // Get subscription history
  const { data: history } = await supabase
    .from("subscription_history")
    .select("id, status, amount_paid, currency, payment_method, payment_reference, created_at, event_data")
    .eq("firm_id", profile.firm_id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing
          </p>
        </div>
      </div>

      <TrialBanner
        daysRemaining={subscription.days_remaining_in_trial}
        trialEndsAt={subscription.trial_ends_at}
        isTrialActive={subscription.is_trial_active}
        subscriptionStatus={subscription.status}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <SubscriptionStatus subscription={subscription} />

        {isOwner && (
          <SubscriptionManagement
            subscription={subscription}
            plan={plan}
            firmId={profile.firm_id}
          />
        )}
      </div>

      {!isOwner && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Only the firm owner can manage subscription settings. Please contact your firm owner
              for subscription management.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {isOwner && history && history.length > 0 && (
          <SubscriptionHistory history={history} />
        )}
        <SubscriptionGuide subscriptionStatus={subscription.status} isOwner={isOwner} />
      </div>
    </div>
  );
}
