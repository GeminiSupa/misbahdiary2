"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EditMatterForm } from "@/components/cases/edit-matter-form";
import { Button } from "@/components/ui/button";
import { Edit, Briefcase } from "lucide-react";
import type { UpdateMatterFormValues } from "@/app/(app)/cases/[id]/actions";

type EditMatterSheetProps = {
  matter: UpdateMatterFormValues;
  clients: Array<{ id: string; label: string }>;
  staff: Array<{ id: string; label: string }>;
  trigger?: React.ReactNode;
};

export function EditMatterSheet({ matter, clients, staff, trigger }: EditMatterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="w-full sm:w-auto min-w-0">
            <Edit className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Edit Matter</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Edit Matter</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update matter details, court information, and team assignments
              </p>
            </div>
          </div>
        </SheetHeader>
        <div className="mt-6">
          <EditMatterForm
            matter={matter}
            clients={clients}
            staff={staff}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

