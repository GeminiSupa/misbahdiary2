"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/clients/client-form";

export function NewClientSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" className="w-full sm:w-auto" size="sm">
          <Plus className="mr-2 h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">New client</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New client</SheetTitle>
        </SheetHeader>
        <div className="mt-2 h-full overflow-y-auto">
          <ClientForm
            onSuccess={() => {
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

