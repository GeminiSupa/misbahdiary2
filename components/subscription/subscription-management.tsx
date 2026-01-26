"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createCheckoutSession, createPortalSession } from "@/app/(app)/subscription/actions";
import type { FirmSubscription } from "@/lib/stripe/types";
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";

type SubscriptionManagementProps = {
  subscription: FirmSubscription;
  plan: {
    id: string;
    name: string;
    price_monthly: number;
    features: unknown;
  } | null;
  firmId: string;
};

export function SubscriptionManagement({
  subscription,
  plan,
  firmId,
}: SubscriptionManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = () => {
    startTransition(async () => {
      const result = await createCheckoutSession(firmId);
      if ("url" in result && result.url) {
        window.location.href = result.url;
      } else if ("message" in result) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleManageBilling = () => {
    startTransition(async () => {
      const result = await createPortalSession(firmId);
      if ("url" in result && result.url) {
        window.location.href = result.url;
      } else if ("message" in result) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Plan</CardTitle>
        <CardDescription>Manage your subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            {plan ? (
              <>
                <p className="font-semibold">{plan.name}</p>
                <p className="text-2xl font-bold">
                  PKR {plan.price_monthly.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Professional Plan</p>
                <p className="text-2xl font-bold">
                  PKR 500.00
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </>
            )}
          </div>
          <Badge variant={subscription.is_subscription_active ? "success" : "outline"}>
            {subscription.is_subscription_active ? "Active" : subscription.status}
          </Badge>
        </div>

        {subscription.is_trial_active && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium mb-2">Free Trial</p>
            <p className="text-sm text-muted-foreground mb-3">
              Subscribe before your trial ends to continue using all features. Secure payment via Stripe.
            </p>
            <Button
              onClick={handleSubscribe}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe Now
                </>
              )}
            </Button>
            {!plan && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                ⚠️ Subscription plan not configured. The system will use the default plan.
              </p>
            )}
          </div>
        )}

        {subscription.is_subscription_active && (
          <div className="space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="font-medium text-green-900 dark:text-green-100">
                  Subscription Active
                </p>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your subscription is active until {subscription.subscription_ends_at && new Date(subscription.subscription_ends_at).toLocaleDateString()}.
              </p>
              {subscription.subscription_ends_at && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {(() => {
                    const endsAt = new Date(subscription.subscription_ends_at);
                    const now = new Date();
                    const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 7 && daysLeft > 0) {
                      return `⚠️ Renewal needed in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
                    }
                    return null;
                  })()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {subscription.stripe_customer_id ? (
                <Button
                  onClick={handleManageBilling}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Manage Billing & Subscription
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              )}
              {!plan && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  ⚠️ Using default plan. Contact support to configure your plan.
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">
                Your subscription automatically renews each month. Use "Manage Billing" to cancel or update.
              </p>
            </div>
          </div>
        )}

        {subscription.status === "expired" && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="font-medium text-destructive mb-2">
              Subscription Expired
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Your subscription has expired. Subscribe to continue using the platform.
            </p>
            <Button
              onClick={handleSubscribe}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe Now
                </>
              )}
            </Button>
            {!plan && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                ⚠️ Subscription plan not configured. The system will use the default plan.
              </p>
            )}
          </div>
        )}

        {/* Fallback: Show subscribe button if none of the above conditions match */}
        {!subscription.is_trial_active && !subscription.is_subscription_active && subscription.status !== "expired" && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium mb-2">Get Started</p>
            <p className="text-sm text-muted-foreground mb-3">
              Start your subscription to access all features.
            </p>
            <Button
              onClick={handleSubscribe}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe Now
                </>
              )}
            </Button>
            {!plan && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                ⚠️ Using default plan. Contact support to configure your plan.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
