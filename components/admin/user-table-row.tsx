"use client";

import { format } from "date-fns";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordCashPaymentSheet } from "@/components/admin/record-cash-payment-sheet";

type UserTableRowProps = {
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

export function UserTableRow({
  full_name,
  email,
  role,
  firm_id,
  firm_name,
  is_firm_owner,
  subscription_status,
  subscription_ends_at,
  trial_ends_at,
}: UserTableRowProps) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="py-3 px-4">
        <span className="font-medium">{full_name || "—"}</span>
        {is_firm_owner && (
          <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            Owner
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-muted-foreground">{email || "—"}</td>
      <td className="py-3 px-4 capitalize">{role?.replace("_", " ") || "—"}</td>
      <td className="py-3 px-4">{firm_name || "—"}</td>
      <td className="py-3 px-4">
        {is_firm_owner ? (
          <span className="flex items-center gap-1.5">
            {subscription_status === "active" ? (
              <>
                <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />
                {subscription_ends_at
                  ? `Until ${format(new Date(subscription_ends_at), "MMM dd, yyyy")}`
                  : "Active"}
              </>
            ) : subscription_status === "trial" ? (
              <>
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                {trial_ends_at
                  ? `Trial until ${format(new Date(trial_ends_at), "MMM dd, yyyy")}`
                  : "Trial"}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                {subscription_status || "Expired"}
              </>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        {is_firm_owner && firm_id ? (
          <RecordCashPaymentSheet
            firmId={firm_id}
            firmName={firm_name || "Firm"}
            trigger={
              <Button variant="outline" size="sm" className="min-h-[48px] min-w-[120px]">
                Record Cash
              </Button>
            }
          />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}
