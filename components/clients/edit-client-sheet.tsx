"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { Edit, User } from "lucide-react";
import type { ClientFormValues } from "@/app/(app)/clients/actions";

type EditClientSheetProps = {
  client: ClientFormValues;
  portalEnabled?: boolean;
  canSetPortalPassword?: boolean;
  trigger?: React.ReactNode;
};

export function EditClientSheet({
  client,
  portalEnabled = false,
  canSetPortalPassword = false,
  trigger,
}: EditClientSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Edit Client</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Edit Client</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update client information and contact details
              </p>
            </div>
          </div>
        </SheetHeader>
        <div className="mt-6">
          <ClientForm
            initialClient={client}
            initialPortalEnabled={portalEnabled}
            canSetPortalPassword={canSetPortalPassword}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

