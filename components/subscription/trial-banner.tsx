"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TrialBannerProps = {
  daysRemaining: number | null;
  trialEndsAt: string | null;
  isTrialActive: boolean;
  subscriptionStatus: string;
};

export function TrialBanner({
  daysRemaining,
  trialEndsAt,
  isTrialActive,
  subscriptionStatus,
}: TrialBannerProps) {
  // Don't show banner if not in trial
  if (!isTrialActive || subscriptionStatus !== "trial") {
    return null;
  }

  const days = daysRemaining ?? 0;
  const isEndingSoon = days <= 3;
  const isExpired = days <= 0;

  if (isExpired) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Trial Expired</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>Your free trial has ended. Subscribe to continue using the platform.</span>
          <Button asChild size="sm">
            <Link href="/subscription">Subscribe Now</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isEndingSoon) {
    return (
      <Alert
        variant="destructive"
        className={cn(
          "mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20",
        )}
      >
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-400">
          Trial Ending Soon
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4 text-amber-700 dark:text-amber-300">
          <span>
            Your free trial ends in {days} {days === 1 ? "day" : "days"}. Subscribe to
            continue uninterrupted access.
          </span>
          <Button asChild size="sm" variant="default">
            <Link href="/subscription">Subscribe Now</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CheckCircle2 className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800 dark:text-blue-400">
        Free Trial Active
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 text-blue-700 dark:text-blue-300">
        <span>
          {days} {days === 1 ? "day" : "days"} remaining in your free trial.
          {trialEndsAt && (
            <span className="ml-2 text-xs opacity-75">
              (Ends {new Date(trialEndsAt).toLocaleDateString()})
            </span>
          )}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href="/subscription">View Plans</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
