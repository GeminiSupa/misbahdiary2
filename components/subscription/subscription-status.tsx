"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import type { FirmSubscription } from "@/lib/stripe/types";
import { format } from "date-fns";

type SubscriptionStatusProps = {
  subscription: FirmSubscription;
};

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const getStatusBadge = () => {
    switch (subscription.status) {
      case "active":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case "trial":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Trial
          </Badge>
        );
      case "past_due":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Past Due
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Canceled
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {subscription.status}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Current subscription and billing information</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(subscription.is_trial_active || subscription.status === "trial") && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:bg-blue-950/20">
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Free Trial {subscription.is_trial_active ? "Active" : "Status"}
              </p>
              {subscription.days_remaining_in_trial !== null ? (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {subscription.days_remaining_in_trial} days remaining
                </p>
              ) : subscription.trial_ends_at ? (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Trial ends: {format(new Date(subscription.trial_ends_at), "PPP")}
                </p>
              ) : subscription.trial_started_at ? (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Trial started: {format(new Date(subscription.trial_started_at), "PPP")}
                </p>
              ) : (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Trial period active (30 days from signup)
                </p>
              )}
              {subscription.trial_ends_at && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Trial ends: {format(new Date(subscription.trial_ends_at), "PPP")}
                </p>
              )}
            </div>
          </div>
        )}

        {subscription.is_subscription_active && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subscription Status:</span>
                <span className="font-medium">Active</span>
              </div>
              {subscription.subscription_started_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {format(new Date(subscription.subscription_started_at), "PPP")}
                  </span>
                </div>
              )}
              {subscription.subscription_ends_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expires on:</span>
                  <span className="font-medium">
                    {format(new Date(subscription.subscription_ends_at), "PPP")}
                  </span>
                </div>
              )}
              {subscription.subscription_ends_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Days remaining:</span>
                  <span className="font-medium">
                    {(() => {
                      const endsAt = new Date(subscription.subscription_ends_at);
                      const now = new Date();
                      const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return daysLeft > 0 ? daysLeft : 0;
                    })()}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This is a recurring subscription. It will automatically renew each month.
              </p>
            </div>
          </div>
        )}

        {subscription.status === "past_due" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/20">
            <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              Payment Failed
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              Your last payment attempt failed. Please update your payment method to continue service.
            </p>
            <Button asChild size="sm" className="min-w-fit whitespace-nowrap">
              <Link href="/subscription" className="block">Update Payment</Link>
            </Button>
          </div>
        )}

        {(subscription.status === "expired" || subscription.status === "canceled") && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="font-medium text-destructive mb-2">
              {subscription.status === "expired" ? "Subscription Expired" : "Subscription Canceled"}
            </p>
            <p className="text-sm text-muted-foreground">
              {subscription.status === "expired"
                ? "Your subscription has expired. Subscribe to continue using the platform."
                : "Your subscription has been canceled. Subscribe to reactivate."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
