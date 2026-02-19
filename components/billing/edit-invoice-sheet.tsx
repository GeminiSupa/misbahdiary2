"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EditInvoiceForm } from "@/components/billing/edit-invoice-form";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvoiceFormValues } from "@/app/(app)/billing/actions";

type EditInvoiceSheetProps = {
  invoiceId: string;
  invoice: InvoiceFormValues & { id: string };
  clients: Array<{ id: string; label: string }>;
  matters: Array<{ id: string; label: string }>;
  unbilledTimeEntries: Array<{
    id: string;
    label: string;
    amount: number;
  }>;
  linkedTimeEntries?: Array<{
    id: string;
    label: string;
    amount: number;
  }>;
  trigger?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
};

export function EditInvoiceSheet({
  invoiceId,
  invoice,
  clients,
  matters,
  unbilledTimeEntries,
  linkedTimeEntries = [],
  trigger,
  variant = "outline",
  size = "sm",
}: EditInvoiceSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant={variant} size={size} className="w-full sm:w-auto">
            <Pencil className="mr-2 h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Edit</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Invoice</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <EditInvoiceForm
            invoiceId={invoiceId}
            invoice={invoice}
            clients={clients}
            matters={matters}
            unbilledTimeEntries={unbilledTimeEntries}
            linkedTimeEntries={linkedTimeEntries}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
