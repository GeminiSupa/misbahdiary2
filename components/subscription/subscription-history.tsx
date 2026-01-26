"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

type SubscriptionHistoryItem = {
  id: string;
  status: string;
  amount_paid: number | null;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  event_data: unknown;
};

type SubscriptionHistoryProps = {
  history: SubscriptionHistoryItem[];
};

export function SubscriptionHistory({ history }: SubscriptionHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "subscribed":
      case "payment_received":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </Badge>
        );
      case "payment_failed":
      case "expired":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "trial_started":
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number | null, currency: string) => {
    if (amount === null) return "N/A";
    const symbol = currency === "PKR" || currency === "USD" ? currency : currency;
    return `${symbol} ${amount.toFixed(2)}`;
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your subscription payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No payment history found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>Your subscription payment history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(item.status)}
                  <span className="text-sm font-medium">
                    {item.status === "subscribed"
                      ? "Subscription Payment"
                      : item.status === "payment_received"
                      ? "Payment Received"
                      : item.status === "payment_failed"
                      ? "Payment Failed"
                      : item.status === "trial_started"
                      ? "Trial Started"
                      : item.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    {format(new Date(item.created_at), "PPP 'at' p")}
                  </p>
                  {item.amount_paid !== null && (
                    <p>
                      Amount: {formatAmount(item.amount_paid, item.currency)}
                    </p>
                  )}
                  {item.payment_method && (
                    <p>Method: {item.payment_method}</p>
                  )}
                  {item.payment_reference && (
                    <p className="text-xs font-mono">
                      Ref: {item.payment_reference.slice(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
