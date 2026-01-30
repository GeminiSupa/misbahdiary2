"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Calendar, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

type SubscriptionGuideProps = {
  subscriptionStatus: string;
  isOwner: boolean;
};

export function SubscriptionGuide({ subscriptionStatus, isOwner }: SubscriptionGuideProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to Manage Your Subscription</CardTitle>
        <CardDescription>Step-by-step guide for subscription management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">1</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Buy Subscription
              </h4>
              <p className="text-sm text-muted-foreground">
                Click the "Subscribe Now" button above to purchase a subscription. You'll be redirected to Stripe for secure payment.
                After payment, your subscription will be active and automatically renew each month.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">2</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                View Dates & Status
              </h4>
              <div className="text-sm text-muted-foreground">
                <p className="mb-1">Check the "Subscription Status" card to see:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>Current subscription status (Active, Trial, Expired)</li>
                  <li>Subscription start date</li>
                  <li>Expiration date</li>
                  <li>Days remaining</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">3</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Manage Billing
              </h4>
              <div className="text-sm text-muted-foreground">
                <p className="mb-1">Use the "Manage Billing" button to access Stripe's customer portal where you can:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>View payment history</li>
                  <li>Update payment methods</li>
                  <li>Download invoices</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">4</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancel or Manage
              </h4>
              <div className="text-sm text-muted-foreground">
                <p className="mb-1"><strong>Recurring subscription:</strong> Your subscription automatically renews each month.</p>
                <p className="mb-1"><strong>To cancel your subscription:</strong></p>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-xs">
                  <li>Click the <strong>"Manage Billing & Subscription"</strong> button in the "Current Plan" card above</li>
                  <li>You'll be redirected to Stripe's secure customer portal</li>
                  <li>In the portal, click <strong>"Cancel subscription"</strong></li>
                  <li>Your subscription will remain active until the end of the current billing period</li>
                  <li>You can reactivate anytime before the period ends</li>
                </ol>
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <strong>Note:</strong> After cancellation, you'll lose access when the current period ends. No refunds for unused time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isOwner && (
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Only the firm owner can manage subscriptions. Contact your firm owner for subscription management.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
