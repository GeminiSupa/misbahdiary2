"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopTimer } from "@/app/(app)/time-tracking/actions";

export function StopTimerButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStop = () => {
    startTransition(async () => {
      const result = await stopTimer();
      if (result.success) {
        router.refresh();
      } else {
        console.error("Failed to stop timer:", result.message);
        alert(result.message || "Failed to stop timer");
      }
    });
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      className="gap-2"
      onClick={handleStop}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Stopping...
        </>
      ) : (
        <>
          <Square className="h-4 w-4" />
          Stop Timer
        </>
      )}
    </Button>
  );
}

