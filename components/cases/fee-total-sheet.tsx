"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FeeTotalForm } from "@/components/cases/fee-total-form";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

type FeeTotalSheetProps = {
  matterId: string;
  currentTotal?: number;
  currentPaid?: number;
  trigger?: React.ReactNode;
};

export function FeeTotalSheet({
  matterId,
  currentTotal = 0,
  currentPaid = 0,
  trigger,
}: FeeTotalSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="w-full sm:w-auto min-w-0">
            <Settings className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Set Fee Total</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Set Fee Total</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FeeTotalForm
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

