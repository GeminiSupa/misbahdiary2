"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimerState = {
  running: { id: string; startedAt: string } | null;
  totalMinutesToday: number;
};

export function TimerControl() {
  const [state, setState] = useState<TimerState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    void refresh();
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function refresh() {
    const res = await fetch("/api/time-tracking", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as TimerState;
    setState(data);
  }

  async function toggleTimer() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: state?.running ? "stop" : "start",
        }),
      });
      if (res.ok) {
        await refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  const running = state?.running ?? null;
  const baseMinutes = state?.totalMinutesToday ?? 0;

  let liveMinutes = baseMinutes;
  if (running) {
    const started = new Date(running.startedAt);
    liveMinutes += Math.max(0, Math.floor((now.getTime() - started.getTime()) / 60000));
  }

  const hours = Math.floor(liveMinutes / 60);
  const minutes = liveMinutes % 60;

  return (
    <Button
      variant={running ? "secondary" : "outline"}
      size="sm"
      className={cn(
        "hidden items-center gap-2 rounded-full border px-3 text-xs font-medium md:inline-flex",
        running && "border-emerald-500/60 bg-emerald-50 text-emerald-700",
      )}
      onClick={toggleTimer}
      disabled={isLoading}
      title="Billable timer"
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          running ? "bg-emerald-500" : "bg-muted-foreground",
        )}
      />
      {running ? "Stop timer" : "Start timer"}
      <span className="text-[11px] text-muted-foreground">
        {hours > 0 ? `${hours}h ` : ""}
        {minutes}m today
      </span>
    </Button>
  );
}


