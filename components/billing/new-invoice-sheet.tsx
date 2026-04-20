"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { InvoiceForm } from "@/components/billing/invoice-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type NewInvoiceSheetProps = {
  clients: Array<{ id: string; label: string }>;
  matters: Array<{ id: string; label: string }>;
  unbilledTimeEntries: Array<{
    id: string;
    label: string;
    amount: number;
  }>;
  trigger?: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
};

export function NewInvoiceSheet({
  clients,
  matters,
  unbilledTimeEntries,
  trigger,
  variant = "secondary",
  size = "default",
}: NewInvoiceSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant={variant} size={size} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
          <span>New invoice</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New invoice</SheetTitle>
        </SheetHeader>
        <div className="mt-2 h-full overflow-y-auto">
          <InvoiceForm
            clients={clients}
            matters={matters}
            unbilledTimeEntries={unbilledTimeEntries}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

