"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { format, parseISO, isAfter, formatDistanceToNow } from "date-fns";
import { hearingStatusOptions, type HearingStatusOption } from "@/lib/constants/hearings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HearingEditDialog } from "@/components/calendar/hearing-edit-dialog";
import { markHearingCompleted } from "@/app/(app)/calendar/actions";
import { Loader2, CheckCircle2, Download, FileText, Search, Clock } from "lucide-react";
import { MatterDocumentUploader } from "@/components/cases/matter-document-uploader";

type HearingRecord = {
  id: string;
  matterId: string;
  matterSerial: string;
  matterCourt: string;
  clientName: string;
  scheduledAt: string;
  status: string;
  durationMinutes: number | null;
  location: string | null;
  notes: string | null;
  // Optional flag to show whether a hearing order document exists
  hasOrder?: boolean;
};

type HearingTimelineProps = {
  hearings: HearingRecord[];
  matters: Array<{ id: string; label: string }>;
};

function statusPillClass(status: string): string {
  switch (status) {
    case "scheduled":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "adjourned":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "cancelled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

export function HearingTimeline({ hearings, matters }: HearingTimelineProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCompleting, startTransition] = useTransition();

  const statusLabel = useMemo(
    () => new Map(hearingStatusOptions.map((option) => [option.value, option.label])),
    [],
  );

  const groupedHearings = useMemo(() => {
    const upcoming: HearingRecord[] = [];
    const past: HearingRecord[] = [];

    hearings.forEach((hearing) => {
      if (
        !query ||
        [
          hearing.matterSerial,
          hearing.clientName,
          hearing.matterCourt,
          hearing.location ?? "",
          hearing.notes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      ) {
        const matchesStatus = statusFilter === "all" || hearing.status === statusFilter;

        if (!matchesStatus) return;

        if (isAfter(parseISO(hearing.scheduledAt), new Date())) {
          upcoming.push(hearing);
        } else {
          past.push(hearing);
        }
      }
    });

    const sortByDate = (items: HearingRecord[]) =>
      items.sort(
        (a, b) =>
          parseISO(a.scheduledAt).getTime() - parseISO(b.scheduledAt).getTime(),
      );

    return {
      upcoming: sortByDate(upcoming),
      past: sortByDate(past).reverse(),
    };
  }, [hearings, query, statusFilter]);

  const nextHearing = groupedHearings.upcoming[0];
  const stats = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingCount = groupedHearings.upcoming.length;
    const thisWeekCount = groupedHearings.upcoming.filter((h) => {
      const d = parseISO(h.scheduledAt);
      return d.getTime() <= in7Days.getTime();
    }).length;
    const pendingOrders = hearings.filter((h) => isAfter(now, parseISO(h.scheduledAt)) && !h.hasOrder).length;
    return { upcomingCount, thisWeekCount, pendingOrders };
  }, [groupedHearings.upcoming, hearings]);

  const handleMarkComplete = (hearingId: string) => {
    startTransition(async () => {
      await markHearingCompleted(hearingId);
    });
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/85 p-4 text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tight sm:text-lg">Hearings docket</h2>
            <p className="mt-0.5 text-xs text-slate-300/80">
              Search fast, update status, and keep orders attached.
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search matter, client, court..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-2xl border-white/10 bg-white/5 pl-9 text-slate-100 placeholder:text-slate-400 focus-visible:ring-teal-500/30"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-[150px] rounded-2xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              <option value="all">All</option>
              {hearingStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {(query || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
                className="h-10 rounded-2xl text-slate-200 hover:bg-white/10 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-lg font-black leading-none sm:text-xl">{stats.upcomingCount}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-300/80">Upcoming</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-lg font-black leading-none sm:text-xl">{stats.thisWeekCount}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-300/80">Next 7 days</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-lg font-black leading-none sm:text-xl">{stats.pendingOrders}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-300/80">Orders pending</p>
          </div>
        </div>

        {nextHearing ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/15 bg-linear-to-r from-amber-500/10 via-white/5 to-white/5 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-200/90">
                Next hearing
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-100">
                {nextHearing.clientName} — {format(parseISO(nextHearing.scheduledAt), "dd MMM")}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-slate-300/80">
                {nextHearing.matterCourt}
                {nextHearing.location ? ` • ${nextHearing.location}` : ""}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
              <Clock className="h-3.5 w-3.5" />
              {format(parseISO(nextHearing.scheduledAt), "hh:mm a")}
            </span>
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="upcoming" className="mt-4">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-3 space-y-2">
          {groupedHearings.upcoming.length > 0 ? (
            groupedHearings.upcoming.map((hearing) => (
              <HearingCard
                key={hearing.id}
                hearing={hearing}
                statusLabel={statusLabel}
                matters={matters}
                onMarkComplete={handleMarkComplete}
                isCompleting={isCompleting}
              />
            ))
          ) : (
            <EmptyState message="No upcoming hearings match your filters." />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-3 space-y-2">
          {groupedHearings.past.length > 0 ? (
            groupedHearings.past.map((hearing) => (
              <HearingCard
                key={hearing.id}
                hearing={hearing}
                statusLabel={statusLabel}
                matters={matters}
                onMarkComplete={handleMarkComplete}
                isCompleting={isCompleting}
              />
            ))
          ) : (
            <EmptyState message="No past hearings to display yet." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HearingCard({
  hearing,
  statusLabel,
  matters,
  onMarkComplete,
  isCompleting,
}: {
  hearing: HearingRecord;
  statusLabel: Map<HearingStatusOption, string>;
  matters: Array<{ id: string; label: string }>;
  onMarkComplete: (hearingId: string) => void;
  isCompleting: boolean;
}) {
  const scheduled = parseISO(hearing.scheduledAt);
  const completed = hearing.status === "completed";
  const [showOrderUploader, setShowOrderUploader] = useState(false);
  return (
    <article className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3 transition hover:bg-white/6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{hearing.clientName}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-300/80">
            {hearing.matterSerial} • {hearing.matterCourt}
            {hearing.location ? ` • ${hearing.location}` : ""}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-200">
            {format(scheduled, "EEE, dd MMM")} • {format(scheduled, "hh:mm a")}
          </p>
        </div>
        <span
          className={[
            "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
            statusPillClass(hearing.status),
          ].join(" ")}
        >
          {statusLabel.get(hearing.status as HearingStatusOption) ?? hearing.status}
        </span>
      </div>

      {hearing.notes ? (
        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-slate-300/85">
          {hearing.notes}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <HearingEditDialog
          hearing={{
            id: hearing.id,
            matterId: hearing.matterId,
            scheduledAt: hearing.scheduledAt,
            durationMinutes: hearing.durationMinutes,
            location: hearing.location,
            status: hearing.status,
            notes: hearing.notes,
          }}
          matters={matters}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={completed || isCompleting}
          onClick={() => onMarkComplete(hearing.id)}
          className="w-full sm:w-auto"
        >
          {isCompleting ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />}
          <span>Mark complete</span>
        </Button>
        <Button variant="ghost" size="sm" className="w-full sm:w-auto" asChild>
          <Link href={`/api/hearings/${hearing.id}/ics`} className="flex items-center gap-2">
            <Download className="h-4 w-4 shrink-0" />
            <span>ICS</span>
          </Link>
        </Button>
        {hearing.hasOrder ? (
          <span className="ml-auto inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">
            <FileText className="mr-1 h-3 w-3" />
            Order on file
          </span>
        ) : (
          <span className="ml-auto text-[11px] font-semibold text-slate-300/70">
            {formatDistanceToNow(scheduled, { addSuffix: true })}
          </span>
        )}
      </div>

      {hearing.matterId ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setShowOrderUploader((prev) => !prev)}
            className="inline-flex w-full items-center gap-1 text-left text-xs font-semibold text-teal-200 hover:underline sm:w-auto"
          >
            <FileText className="mr-1 h-3 w-3" />
            {showOrderUploader ? "Hide hearing order upload" : "Upload hearing order / order sheet"}
          </button>
          {showOrderUploader ? (
            <div className="mt-2">
              <MatterDocumentUploader matterId={hearing.matterId} hearingId={hearing.id} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-6 text-center">
      <p className="text-sm font-medium text-slate-300/80">{message}</p>
    </div>
  );
}

