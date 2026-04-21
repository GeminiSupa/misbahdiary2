import Link from "next/link";
import { redirect } from "next/navigation";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";

type KpiRow = {
  label: string;
  value: string | number;
  hint: string;
  href?: string;
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

  // --- KPIs with additional metrics ---
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    { count: activeMattersCount },
    { count: hearingsThisWeekCount },
    { count: totalClientsCount },
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
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", profile.firm_id),
    supabase
      .from("invoices")
      .select("status,total_amount,amount_paid,due_date,issue_date")
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

  // Revenue this month (invoices issued this month)
  const revenueThisMonth = invoiceSummary.reduce((sum, invoice) => {
    if (invoice.issue_date) {
      const issueDate = new Date(invoice.issue_date);
      if (issueDate >= monthStart && issueDate <= monthEnd) {
        return sum + Number(invoice.total_amount ?? 0);
      }
    }
    return sum;
  }, 0);

  // Collection rate (total paid / total invoiced)
  const totalInvoiced = invoiceSummary.reduce(
    (sum, invoice) => sum + Number(invoice.total_amount ?? 0),
    0,
  );
  const totalPaid = invoiceSummary.reduce(
    (sum, invoice) => sum + Number(invoice.amount_paid ?? 0),
    0,
  );
  const collectionRate =
    totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

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
      href: "/cases",
    },
    {
      label: "Total clients",
      value: totalClientsCount ?? 0,
      hint: "All registered clients",
      href: "/clients",
    },
    {
      label: "Hearings this week",
      value: hearingsThisWeekCount ?? 0,
      hint: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`,
      href: "/calendar",
    },
    {
      label: "Revenue this month",
      value: currency.format(revenueThisMonth),
      hint: `Invoices issued in ${format(today, "MMMM")}`,
      href: "/billing",
    },
    {
      label: "Outstanding invoices",
      value: currency.format(outstanding),
      hint: `${overdueCount} overdue`,
      href: "/billing",
    },
    {
      label: "Collection rate",
      value: `${collectionRate}%`,
      hint: `Paid: ${currency.format(totalPaid)} / Invoiced: ${currency.format(totalInvoiced)}`,
      href: "/billing",
    },
  ];

  const hearingsToday = hearingsTodayRes.data ?? [];

  return (
    <div className="-mx-4 rounded-3xl bg-linear-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-6 lg:mx-0 lg:px-0">
      <div className="space-y-3 sm:space-y-4 lg:px-4">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight sm:text-lg">
                Welcome back, {displayName}
              </h1>
              <p className="mt-0.5 text-xs text-slate-300/80 sm:max-w-2xl">
                Prioritise hearings, unblock billing, and keep your clients informed — everything you
                need for the day lives here.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Button asChild variant="default" className="w-full sm:w-auto" size="sm">
                <Link href="/cases" className="flex items-center whitespace-nowrap">
                  New case
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto" size="sm">
                <Link href="/calendar" className="flex items-center whitespace-nowrap">
                  Schedule hearing
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-5">
          <DashboardKpiCards kpis={kpis} />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-black tracking-tight text-slate-100 sm:text-lg">
                Today&apos;s agenda
              </h2>
              <p className="mt-0.5 text-xs text-slate-300/80">
                Hearings and key events scheduled for today.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
                <Link href="/calendar" className="whitespace-nowrap">Open calendar</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link href="/calendar/print/today" target="_blank" className="whitespace-nowrap">
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
                  className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/4 px-3 py-2 text-sm transition hover:bg-white/6 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {hearing.matter?.serial_number || hearing.matter?.case_number || "Matter"}
                    </p>
                    <p className="truncate text-[11px] text-slate-300/80">
                      {hearing.matter?.court_name ?? "Court not set"}
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-200 sm:shrink-0">
                    {format(new Date(hearing.scheduled_at), "p")}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-4">
              <p className="text-xs font-medium text-slate-300/80 sm:text-sm">
                No hearings scheduled for today.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


