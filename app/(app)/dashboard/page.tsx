import Link from "next/link";
import { redirect } from "next/navigation";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AIAssistantChat } from "@/components/ai/ai-assistant-chat";

type KpiRow = {
  label: string;
  value: string | number;
  hint: string;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return redirect("/onboarding");
  }

  const displayName = profile.full_name || user.email?.split("@")[0] || "User";

  // --- KPIs (minimal, tested step) ---
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    { count: activeMattersCount },
    { count: hearingsThisWeekCount },
    invoicesRes,
    hearingsTodayRes,
  ] = await Promise.all([
    supabase
      .from("matters")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", profile.firm_id),
    supabase
      .from("hearings")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", profile.firm_id)
      .gte("scheduled_at", weekStart.toISOString())
      .lte("scheduled_at", weekEnd.toISOString()),
    supabase
      .from("invoices")
      .select("status,total_amount,amount_paid,due_date")
      .eq("firm_id", profile.firm_id),
    supabase
      .from("hearings")
      .select(
        `
        id,
        scheduled_at,
        location,
        matter:matters (
          id,
          serial_number,
          case_number,
          court_name
        )
      `,
      )
      .eq("firm_id", profile.firm_id)
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true }),
  ]);

  const invoiceSummary = invoicesRes.data ?? [];

  const outstanding =
    invoiceSummary.reduce((sum, invoice) => {
      if (invoice.status === "sent" || invoice.status === "overdue") {
        const paid = Number(invoice.amount_paid ?? 0);
        const total = Number(invoice.total_amount ?? 0);
        return sum + Math.max(total - paid, 0);
      }
      return sum;
    }, 0) ?? 0;

  const overdueCount = invoiceSummary.filter(
    (invoice) => invoice.status === "overdue",
  ).length;

  const currency = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });

  const kpis: KpiRow[] = [
    {
      label: "Active matters",
      value: activeMattersCount ?? 0,
      hint: "Open litigation and advisory work",
    },
    {
      label: "Hearings this week",
      value: hearingsThisWeekCount ?? 0,
      hint: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`,
    },
    {
      label: "Outstanding invoices",
      value: currency.format(outstanding),
      hint: `${overdueCount} overdue`,
    },
  ];

  const hearingsToday = hearingsTodayRes.data ?? [];

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Welcome Card */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Welcome back, {displayName}</h1>
              <p className="text-xs text-muted-foreground sm:text-sm sm:max-w-2xl">
                Prioritise hearings, unblock billing, and keep your clients informed — everything you
                need for the day lives here.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Button asChild variant="default" className="w-full sm:w-auto" size="sm">
                <Link href="/cases">New case</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto" size="sm">
                <Link href="/calendar">Schedule hearing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi, index) => {
          const colorClasses = [
            "sap-kpi-tile-primary",
            "sap-kpi-tile-success",
            "sap-kpi-tile-warning",
          ];
          const colorClass = colorClasses[index % colorClasses.length];
          return (
            <div
              key={kpi.label}
              className={colorClass}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                {kpi.label}
              </p>
              <p className="mt-1.5 text-lg font-semibold text-foreground sm:text-xl">
                {kpi.value}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">{kpi.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Today's Agenda (minimal version) */}
      <div className="sap-card-primary">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Today&apos;s agenda
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Hearings and key events scheduled for today.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
                <Link href="/calendar">Open calendar</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link href="/calendar/print/today" target="_blank">
                  Print today&apos;s docket
                </Link>
              </Button>
            </div>
          </div>

          {hearingsToday.length > 0 ? (
            <div className="space-y-2">
              {hearingsToday.map((hearing) => (
                <Link
                  key={hearing.id}
                  href="/calendar"
                  className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {hearing.matter?.serial_number ||
                        hearing.matter?.case_number ||
                        "Matter"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {hearing.matter?.court_name ?? "Court not set"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground sm:flex-shrink-0">
                    {format(new Date(hearing.scheduled_at), "p")}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="sap-subtle">
              <p className="text-xs text-muted-foreground sm:text-sm">
                No hearings scheduled for today.
              </p>
              <Button asChild variant="default" className="mt-3 w-full sm:w-auto" size="sm">
                <Link href="/calendar">Schedule a hearing</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Quick Access */}
      <div className="sap-card-info">
        <div className="sap-card-body p-0">
          <div className="p-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground sm:text-lg">
                  AI Research Assistant
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
                  Quick access to AI-powered research and document analysis
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                <Link href="/ai-assistant">Open Full Assistant</Link>
              </Button>
            </div>
          </div>
          <div className="h-[380px] sm:h-[450px]">
            <AIAssistantChat />
          </div>
        </div>
      </div>
    </div>
  );
}


