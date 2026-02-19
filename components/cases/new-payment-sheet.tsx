"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PaymentForm } from "@/components/cases/payment-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type NewPaymentSheetProps = {
  matterId: string;
  currentTotal?: number;
  currentPaid?: number;
  trigger?: React.ReactNode;
};

export function NewPaymentSheet({
  matterId,
  currentTotal = 0,
  currentPaid = 0,
  trigger,
}: NewPaymentSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Record Payment</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Record Payment</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <PaymentForm
            matterId={matterId}
            currentTotal={currentTotal}
            currentPaid={currentPaid}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

