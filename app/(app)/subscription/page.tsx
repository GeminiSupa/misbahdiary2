import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/app/(app)/subscription/actions";
import { SubscriptionStatus } from "@/components/subscription/subscription-status";
import { TrialBanner } from "@/components/subscription/trial-banner";
import { Card, CardContent } from "@/components/ui/card";
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
        <h1 className="text-3xl font-bold">Subscription</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{subscriptionResult.message}</p>
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
    const { data: planData } = await supabase
      .from("subscription_plans")
      .select("id, name, price_monthly, price_yearly, features")
      .eq("id", subscription.plan_id)
      .single();
    plan = planData;
  }

  // If no plan found, get the default Professional Plan
  if (!plan) {
    const { data: defaultPlan } = await supabase
      .from("subscription_plans")
      .select("id, name, price_monthly, price_yearly, features")
      .eq("name", "Professional Plan")
      .eq("is_active", true)
      .maybeSingle();
    plan = defaultPlan;
  }

  // Fallback plan if no plan is found in database
  // This ensures the component always has a plan object
  if (!plan) {
    plan = {
      id: "default",
      name: "Professional Plan",
      price_monthly: 500.00,
      price_yearly: 4999.00,
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
