import Link from "next/link";
import { redirect } from "next/navigation";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col gap-6">
      {/* Welcome Card */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold">Welcome back, {displayName}</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Prioritise hearings, unblock billing, and keep your clients informed — everything you
                need for the day lives here.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="secondary">
                <Link href="/cases">New case</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/calendar">Schedule hearing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {kpi.value}
            </p>
            <p className="text-xs text-muted-foreground">{kpi.hint}</p>
          </div>
        ))}
      </div>

      {/* Today's Agenda (minimal version) */}
      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Today&apos;s agenda
              </h2>
              <p className="text-sm text-muted-foreground">
                Hearings and key events scheduled for today.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/calendar">Open calendar</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
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
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/90 px-4 py-3 text-sm hover:border-primary/40 hover:bg-card/95 hover:shadow-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {hearing.matter?.serial_number ||
                        hearing.matter?.case_number ||
                        "Matter"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hearing.matter?.court_name ?? "Court not set"}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(hearing.scheduled_at), "p")}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="sap-subtle">
              <p className="text-sm text-muted-foreground">
                No hearings scheduled for today.
              </p>
              <Button asChild variant="secondary" className="mt-3">
                <Link href="/calendar">Schedule a hearing</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


