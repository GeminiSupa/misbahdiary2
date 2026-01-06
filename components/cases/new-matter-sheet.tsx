"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CaseForm } from "@/components/cases/case-form";
import { Button } from "@/components/ui/button";

type NewMatterSheetProps = {
  clients: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; name: string }>;
  trigger?: React.ReactNode;
};

export function NewMatterSheet({ clients, staff, trigger }: NewMatterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="secondary" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New matter
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[600px] lg:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Create New Matter</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <CaseForm
            clients={clients}
            staff={staff}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

