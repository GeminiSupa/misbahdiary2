"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MatterOption = {
  id: string;
  title: string;
  clientName?: string;
};

type StartTimerSheetProps = {
  matters: MatterOption[];
  onSuccess?: () => void;
};

export function StartTimerSheet({ matters, onSuccess }: StartTimerSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [matterId, setMatterId] = useState<string>("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/time-tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            matterId: matterId || null,
            description: description.trim() || null,
          }),
        });

        if (res.ok) {
          setOpen(false);
          setMatterId("");
          setDescription("");
          router.refresh();
          onSuccess?.();
        } else {
          const error = await res.json().catch(() => ({ error: "Failed to start timer" }));
          console.error("Failed to start timer:", error);
          alert(error.error || "Failed to start timer");
        }
      } catch (error) {
        console.error("Failed to start timer:", error);
        alert("Failed to start timer. Please try again.");
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          Start Timer
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Start Time Tracker
          </SheetTitle>
          <SheetDescription>
            Track billable time for a matter. The timer will run until you stop it.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="matter">Link to Matter (Optional)</Label>
            <Select value={matterId} onValueChange={setMatterId}>
              <SelectTrigger id="matter">
                <SelectValue placeholder="Select a matter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None - General time</SelectItem>
                {matters.map((matter) => (
                  <SelectItem key={matter.id} value={matter.id}>
                    {matter.title}
                    {matter.clientName && ` - ${matter.clientName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Link this time entry to a specific matter for better tracking and billing.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="e.g., Client consultation, Document review, Court appearance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Add a brief description of what you&apos;re working on.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Start Timer
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

