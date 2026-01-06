import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, Play, Square, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StopTimerButton } from "@/components/time-tracking/stop-timer-button";
import { EditTimeEntrySheet } from "@/components/time-tracking/edit-time-entry-sheet";
import { DeleteTimeEntryButton } from "@/components/time-tracking/delete-time-entry-button";

export default async function TimeTrackingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    redirect("/onboarding");
  }

  // Get running timer
  const { data: runningEntry } = await supabase
    .from("time_entries")
    .select("id, started_at, description, matter_id")
    .eq("user_id", user.id)
    .eq("firm_id", profile.firm_id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get matter details if running entry has a matter_id
  let runningMatter: any = null;
  let runningClient: any = null;
  if (runningEntry?.matter_id) {
    const { data: matter } = await supabase
      .from("matters")
      .select("id, case_number, client_brief, client_id")
      .eq("id", runningEntry.matter_id)
      .maybeSingle();

    if (matter?.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("id, full_name")
        .eq("id", matter.client_id)
        .maybeSingle();
      runningClient = client;
    }
    runningMatter = matter;
  }

  // Get today's entries
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayEntries } = await supabase
    .from("time_entries")
    .select("id, started_at, ended_at, duration_minutes, description, billable, amount, matter_id, billing_rate")
    .eq("user_id", user.id)
    .eq("firm_id", profile.firm_id)
    .gte("started_at", startOfDay.toISOString())
    .order("started_at", { ascending: false });

  // Get matter details for today's entries
  const matterIds = new Set(
    todayEntries?.filter((e) => e.matter_id).map((e) => e.matter_id as string) ?? []
  );
  const matterMap = new Map<string, any>();
  const clientMap = new Map<string, any>();

  if (matterIds.size > 0) {
    const { data: matters } = await supabase
      .from("matters")
      .select("id, case_number, client_brief, client_id")
      .in("id", Array.from(matterIds));

    matters?.forEach((matter) => {
      matterMap.set(matter.id, matter);
    });

    const clientIds = new Set(
      matters?.filter((m) => m.client_id).map((m) => m.client_id as string) ?? []
    );

    if (clientIds.size > 0) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, full_name")
        .in("id", Array.from(clientIds));

      clients?.forEach((client) => {
        clientMap.set(client.id, client);
      });
    }
  }

  // Get this week's entries
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data: weekEntries } = await supabase
    .from("time_entries")
    .select("duration_minutes, amount")
    .eq("user_id", user.id)
    .eq("firm_id", profile.firm_id)
    .gte("started_at", startOfWeek.toISOString());

  // Calculate totals
  const totalMinutesToday =
    todayEntries?.reduce((sum, entry) => {
      if (entry.duration_minutes != null) return sum + entry.duration_minutes;
      if (entry.started_at && !entry.ended_at) {
        const started = new Date(entry.started_at);
        return sum + Math.floor((now.getTime() - started.getTime()) / 60000);
      }
      return sum;
    }, 0) ?? 0;

  const totalMinutesWeek =
    weekEntries?.reduce((sum, entry) => sum + (entry.duration_minutes ?? 0), 0) ?? 0;

  const totalAmountWeek =
    weekEntries?.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0) ?? 0;

  const hoursToday = Math.floor(totalMinutesToday / 60);
  const minutesToday = totalMinutesToday % 60;
  const hoursWeek = Math.floor(totalMinutesWeek / 60);
  const minutesWeek = totalMinutesWeek % 60;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Time Tracking</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Track and manage your billable hours</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <div className="sap-card">
          <div className="sap-card-body">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">Today</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">
                  {hoursToday > 0 ? `${hoursToday}h ` : ""}
                  {minutesToday}m
                </p>
              </div>
              <div className="rounded-full bg-primary/10 p-2.5 flex-shrink-0 sm:p-3">
                <Clock className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="sap-card">
          <div className="sap-card-body">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">This Week</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">
                  {hoursWeek > 0 ? `${hoursWeek}h ` : ""}
                  {minutesWeek}m
                </p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-2.5 flex-shrink-0 sm:p-3">
                <Clock className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="sap-card">
          <div className="sap-card-body">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">Week Revenue</p>
                <p className="mt-1 text-xl font-bold sm:text-2xl">
                  PKR {totalAmountWeek.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-2.5 flex-shrink-0 sm:p-3">
                <DollarSign className="h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Running Timer */}
      {runningEntry && (
        <div className="sap-card border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-background">
          <div className="sap-card-body">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[10px] sm:text-xs">
                    <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 sm:mr-1.5 sm:h-2 sm:w-2" />
                    Timer Running
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">Started</p>
                  <p className="text-base font-semibold sm:text-lg">
                    {format(new Date(runningEntry.started_at), "h:mm a")}
                  </p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">
                    {formatDistanceToNow(new Date(runningEntry.started_at), { addSuffix: true })}
                  </p>
                </div>
                {runningEntry.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Description</p>
                    <p className="text-xs sm:text-sm truncate">{runningEntry.description}</p>
                  </div>
                )}
                {runningMatter && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground sm:text-sm">Matter</p>
                    <p className="text-xs font-semibold truncate sm:text-sm">
                      {runningMatter.case_number || runningMatter.client_brief || "N/A"}
                    </p>
                    {runningClient && (
                      <p className="text-[10px] text-muted-foreground truncate sm:text-xs">{runningClient.full_name}</p>
                    )}
                  </div>
                )}
              </div>
              <StopTimerButton />
            </div>
          </div>
        </div>
      )}

      {/* Today's Entries */}
      <div className="sap-card">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="min-w-0">
              <h2 className="text-base font-semibold sm:text-lg">Today&apos;s Entries</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {todayEntries?.length ?? 0} time entries recorded today
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
            {!todayEntries || todayEntries.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-6 text-center sm:p-8">
                <Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2 sm:h-10 sm:w-10 sm:mb-3" />
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                  No time entries recorded today. Start a timer to begin tracking your time.
                </p>
              </div>
            ) : (
              todayEntries.map((entry) => {
                const isRunning = !entry.ended_at;
                const duration =
                  entry.duration_minutes ??
                  (isRunning
                    ? Math.floor((now.getTime() - new Date(entry.started_at).getTime()) / 60000)
                    : 0);
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "rounded-xl border p-3 transition hover:shadow-md sm:p-4",
                      isRunning
                        ? "border-emerald-500/30 bg-emerald-50/30"
                        : "border-border/60 bg-background/70"
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {isRunning ? (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[10px] sm:text-xs">
                              <span className="mr-1 h-1 w-1 animate-pulse rounded-full bg-emerald-500 sm:mr-1.5 sm:h-1.5 sm:w-1.5" />
                              Running
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">Completed</Badge>
                          )}
                          {entry.billable && (
                            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-700 text-[10px] sm:text-xs">
                              Billable
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-sm sm:text-base">
                          {hours > 0 ? `${hours}h ` : ""}
                          {minutes}m
                        </p>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                          {format(new Date(entry.started_at), "h:mm a")}
                          {entry.ended_at && ` - ${format(new Date(entry.ended_at), "h:mm a")}`}
                        </p>
                        {entry.description && (
                          <p className="text-xs truncate sm:text-sm">{entry.description}</p>
                        )}
                        {entry.matter_id && matterMap.has(entry.matter_id) && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground sm:text-xs">
                            <FileText className="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
                            <span className="truncate">
                              {matterMap.get(entry.matter_id)?.case_number ||
                                matterMap.get(entry.matter_id)?.client_brief ||
                                "General"}
                            </span>
                            {matterMap.get(entry.matter_id)?.client_id &&
                              clientMap.has(matterMap.get(entry.matter_id).client_id) && (
                                <span className="text-muted-foreground/70 truncate">
                                  • {clientMap.get(matterMap.get(entry.matter_id).client_id)?.full_name}
                                </span>
                              )}
                          </div>
                        )}
                        {entry.amount && (
                          <p className="text-xs font-medium text-emerald-600 sm:text-sm">
                            PKR {Number(entry.amount).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {!isRunning && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <EditTimeEntrySheet
                            entry={{
                              id: entry.id,
                              started_at: entry.started_at,
                              ended_at: entry.ended_at,
                              duration_minutes: entry.duration_minutes,
                              description: entry.description,
                              billable: entry.billable ?? true,
                              billing_rate: entry.billing_rate,
                            }}
                          />
                          <DeleteTimeEntryButton entryId={entry.id} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

