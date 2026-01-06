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
import { Loader2, CheckCircle2, Download, FileText } from "lucide-react";
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

  const handleMarkComplete = (hearingId: string) => {
    startTransition(async () => {
      await markHearingCompleted(hearingId);
    });
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">Hearings</h2>
          <p className="text-sm text-muted-foreground">
            Upcoming and past hearings organised chronologically.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search hearings..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-48"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm sm:w-40"
          >
            <option value="all">All statuses</option>
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
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="mt-4">
        <TabsList className="grid w-full grid-cols-2 bg-muted/60">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
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

        <TabsContent value="past" className="mt-4 space-y-4">
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
    <article className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {format(scheduled, "EEEE, dd MMM yyyy")}
          </p>
          <h3 className="text-base font-semibold text-foreground">{hearing.clientName}</h3>
          <p className="text-xs text-muted-foreground">{hearing.matterCourt}</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {statusLabel.get(hearing.status as HearingStatusOption) ?? hearing.status}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span>
          Time:{" "}
          <span className="font-medium text-foreground">
            {format(scheduled, "hh:mm a")}
          </span>
        </span>
        {hearing.durationMinutes ? (
          <span>Duration: {hearing.durationMinutes} minutes</span>
        ) : null}
        {hearing.location ? <span>Venue: {hearing.location}</span> : null}
      </div>
      <div className="mt-3 text-sm text-muted-foreground">
        <p>
          Matter ref:{" "}
          <span className="font-medium text-foreground">{hearing.matterSerial}</span>
        </p>
        {hearing.notes ? <p className="mt-2 text-xs leading-relaxed">{hearing.notes}</p> : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
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
        >
          {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Mark complete
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/api/hearings/${hearing.id}/ics`}>
            <Download className="mr-2 h-4 w-4" />
            ICS
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {hearing.hasOrder ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <FileText className="mr-1 h-3 w-3" />
              Order on file
            </span>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(scheduled, { addSuffix: true })}
        </span>
      </div>

      {hearing.matterId ? (
        <div className="mt-3 border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={() => setShowOrderUploader((prev) => !prev)}
            className="inline-flex items-center text-xs font-medium text-primary hover:underline"
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
    <div className="rounded-xl border border-dashed border-border/70 bg-background/80 p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

