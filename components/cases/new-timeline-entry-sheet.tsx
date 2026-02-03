"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TimelineEntryForm } from "@/components/cases/timeline-entry-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type NewTimelineEntrySheetProps = {
  matterId: string;
  trigger?: React.ReactNode;
};

export function NewTimelineEntrySheet({ matterId, trigger }: NewTimelineEntrySheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="w-full sm:w-auto min-w-0">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Add Entry</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Timeline Entry</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <TimelineEntryForm
            matterId={matterId}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

