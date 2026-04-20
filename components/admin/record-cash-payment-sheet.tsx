"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote } from "lucide-react";
import { recordCashSubscriptionPayment } from "@/app/(app)/admin/actions";

type RecordCashPaymentSheetProps = {
  firmId: string;
  firmName: string;
  trigger?: React.ReactNode;
};

export function RecordCashPaymentSheet({
  firmId,
  firmName,
  trigger,
}: RecordCashPaymentSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const billingInterval = (formData.get("billingInterval") as "monthly" | "yearly") || "monthly";
    const amountStr = formData.get("amount") as string | null;
    const amount = amountStr && amountStr.trim() ? parseFloat(amountStr) : undefined;
    const reference = (formData.get("reference") as string | null)?.trim() || undefined;

    const result = await recordCashSubscriptionPayment(
      firmId,
      billingInterval,
      amount,
      reference,
    );

    setIsPending(false);
    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.message ?? "Something went wrong.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="min-h-[48px] min-w-fit">
            <Banknote className="mr-2 h-4 w-4 shrink-0" />
            Record Cash Payment
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Record Cash Payment</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >
          <div>
            <p className="text-sm text-muted-foreground">
              Activate or extend subscription for <strong>{firmName}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Billing Period</Label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="billingInterval"
                  value="monthly"
                  defaultChecked
                  className="rounded-full"
                />
                <span>Monthly (30 days)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="billingInterval"
                  value="yearly"
                  className="rounded-full"
                />
                <span>Yearly (365 days)</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PKR) - optional</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Receipt / Reference - optional</Label>
            <Input
              id="reference"
              name="reference"
              type="text"
              placeholder="e.g. Receipt #123"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="min-h-[48px] min-w-[140px]">
              {isPending ? "Recording…" : "Record Payment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="min-h-[48px] min-w-[100px]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
