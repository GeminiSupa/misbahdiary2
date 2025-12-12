"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Square, Clock } from "lucide-react";

type TimerState = {
  running: { id: string; startedAt: string; description?: string | null; matterId?: string | null } | null;
  totalMinutesToday: number;
};

export function TimerControl() {
  const router = useRouter();
  const [state, setState] = useState<TimerState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    void refresh();
    // Update every second when timer is running, every 30 seconds when not
    const interval = state?.running ? 1000 : 30000;
    const id = setInterval(() => {
      setNow(new Date());
      // Refresh state every 30 seconds to sync with server
      if (!state?.running) {
        void refresh();
      }
    }, interval);
    return () => clearInterval(id);
  }, [state?.running]);

  async function refresh() {
    try {
      const res = await fetch("/api/time-tracking", { 
        cache: "no-store",
        credentials: "include",
        next: { revalidate: 0 }
      });
      if (!res.ok) return;
      const data = (await res.json()) as TimerState;
      setState(data);
    } catch (error) {
      console.error("Failed to refresh timer state:", error);
    }
  }

  async function toggleTimer() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: state?.running ? "stop" : "start",
        }),
      });
      if (res.ok) {
        await refresh();
        router.refresh();
      } else {
        const errorText = await res.text().catch(() => "Failed to toggle timer");
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Failed to toggle timer" };
        }
        
        // Only log if there's meaningful error content
        if (errorData?.error && typeof errorData.error === "string" && errorData.error.trim().length > 0) {
          console.error("Timer error:", errorData.error);
        }
      }
    } catch (error) {
      console.error("Failed to toggle timer:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const running = state?.running ?? null;
  const baseMinutes = state?.totalMinutesToday ?? 0;

  let liveMinutes = baseMinutes;
  let elapsedSeconds = 0;
  if (running) {
    const started = new Date(running.startedAt);
    const elapsedMs = now.getTime() - started.getTime();
    elapsedSeconds = Math.floor(elapsedMs / 1000);
    liveMinutes += Math.max(0, Math.floor(elapsedMs / 60000));
  }

  const hours = Math.floor(liveMinutes / 60);
  const minutes = liveMinutes % 60;
  const seconds = elapsedSeconds % 60;

  // Format time display
  const timeDisplay = running
    ? `${hours > 0 ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : hours > 0
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button
        variant={running ? "default" : "outline"}
        size="sm"
        className={cn(
          "items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-all",
          running
            ? "border-emerald-500/60 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700"
            : "border-border bg-background hover:bg-accent",
        )}
        onClick={toggleTimer}
        disabled={isLoading}
        title={running ? "Click to stop timer" : "Click to start timer"}
      >
        {running ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Start</span>
          </>
        )}
      </Button>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
          running
            ? "border-emerald-500/30 bg-emerald-50/50 text-emerald-700"
            : "border-border/60 bg-muted/30 text-muted-foreground",
        )}
      >
        <Clock className={cn("h-3.5 w-3.5", running && "animate-pulse text-emerald-600")} />
        <span className="tabular-nums">{timeDisplay}</span>
        <span className="text-[10px] text-muted-foreground/70">today</span>
      </div>
    </div>
  );
}


