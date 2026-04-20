"use client";

import { format } from "date-fns";
import { BadgeCheck, Clock, XCircle, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordCashPaymentSheet } from "@/components/admin/record-cash-payment-sheet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type UserCardProps = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  firm_id: string | null;
  firm_name: string | null;
  is_firm_owner: boolean;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
};

export function UserCard(props: UserCardProps) {
  const {
    full_name,
    email,
    role,
    firm_id,
    firm_name,
    is_firm_owner,
    subscription_status,
    subscription_ends_at,
    trial_ends_at,
  } = props;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold truncate">{full_name || "—"}</p>
            {email && (
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {email}
              </p>
            )}
          </div>
          {is_firm_owner && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded shrink-0">
              Owner
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>{firm_name || "—"}</span>
        </div>
        <div className="text-sm capitalize text-muted-foreground">{role?.replace("_", " ") || "—"}</div>
        {is_firm_owner && (
          <div className="flex items-center gap-2 text-sm">
            {subscription_status === "active" ? (
              <>
                <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />
                <span>
                  {subscription_ends_at
                    ? `Active until ${format(new Date(subscription_ends_at), "MMM dd, yyyy")}`
                    : "Active"}
                </span>
              </>
            ) : subscription_status === "trial" ? (
              <>
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  {trial_ends_at
                    ? `Trial until ${format(new Date(trial_ends_at), "MMM dd, yyyy")}`
                    : "Trial"}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                <span>{subscription_status || "Expired"}</span>
              </>
            )}
          </div>
        )}
        {is_firm_owner && firm_id && (
          <RecordCashPaymentSheet
            firmId={firm_id}
            firmName={firm_name || "Firm"}
            trigger={
              <Button variant="outline" size="sm" className="w-full min-h-[48px]">
                Record Cash Payment
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
