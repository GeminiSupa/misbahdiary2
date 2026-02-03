"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HearingForm } from "@/components/calendar/hearing-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type NewHearingSheetProps = {
  matters: Array<{ id: string; label: string }>;
  trigger?: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
};

export function NewHearingSheet({
  matters,
  trigger,
  variant = "secondary",
  size = "default",
}: NewHearingSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant={variant} size={size} className="w-full sm:w-auto min-w-0">
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Schedule hearing</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] lg:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Schedule hearing</SheetTitle>
        </SheetHeader>
        <div className="mt-2 h-full overflow-y-auto pb-4">
          <HearingForm matters={matters} onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

