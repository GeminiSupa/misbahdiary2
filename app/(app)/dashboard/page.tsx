import Link from "next/link";
import { redirect } from "next/navigation";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";
import { TrialBanner } from "@/components/subscription/trial-banner";
import { getSubscriptionStatus } from "@/app/(app)/subscription/actions";
import { getDashboardPreferences } from "@/app/(app)/dashboard/actions";
import { CustomizableDashboard } from "@/components/dashboard/customizable-dashboard";
import type { FirmSubscription } from "@/lib/stripe/types";
import type { DashboardWidget } from "@/lib/types/dashboard";
import { LayoutDashboard } from "lucide-react";

// Type guard to check if result is FirmSubscription
function isFirmSubscription(
  result: FirmSubscription | { message?: string }
): result is FirmSubscription {
  return "status" in result && !("message" in result);
}

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
    .select("firm_id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return redirect("/onboarding");
  }

  const displayName = profile.full_name || user.email?.split("@")[0] || "User";

  // STRICT BLOCKING: Enforce subscription access (backup to middleware)
  const { enforceSubscriptionAccess } = await import("@/lib/server/subscription-check");
  await enforceSubscriptionAccess(profile.firm_id);

  // Get subscription status
  const subscriptionResult = await getSubscriptionStatus(profile.firm_id);
  // Type guard: FirmSubscription has 'status' property, ActionState has 'message' property
  const subscription = isFirmSubscription(subscriptionResult) ? subscriptionResult : null;

  // Import access control utilities
  const { canUserSeeAllCases } = await import("@/lib/server/access-control");
  const canSeeAll = await canUserSeeAllCases(user.id, profile.firm_id);

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

  // Build matters query based on role
  let mattersCountQuery = supabase
    .from("matters")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", profile.firm_id);

  if (!canSeeAll) {
    const userRole = profile?.role;
    if (userRole === "associate" || userRole === "of_counsel") {
      mattersCountQuery = mattersCountQuery.or(`created_by.eq.${user.id},assigned_attorneys.cs.{${user.id}}`);
    } else if (userRole === "paralegal" || userRole === "staff") {
      mattersCountQuery = mattersCountQuery.contains("assigned_attorneys", [user.id]);
    } else {
      mattersCountQuery = mattersCountQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const [
    { count: activeMattersCount },
    { count: hearingsThisWeekCount },
    { count: totalClientsCount },
    invoicesRes,
    hearingsTodayRes,
  ] = await Promise.all([
    mattersCountQuery,
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
    // Invoices - all team members can see all invoices in their firm
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

  // Transform hearings data to match expected type
  const hearingsToday = (hearingsTodayRes.data ?? []).map((hearing) => ({
    id: hearing.id,
    scheduled_at: hearing.scheduled_at,
    matter: hearing.matter
      ? {
          serial_number: hearing.matter.serial_number,
          case_number: hearing.matter.case_number ?? undefined,
          court_name: hearing.matter.court_name ?? undefined,
        }
      : null,
  }));

  // Get dashboard preferences or use defaults
  const preferences = await getDashboardPreferences();
  let widgets: DashboardWidget[] = preferences?.widgets || [];

  // Create default widgets if none exist
  if (widgets.length === 0) {
    widgets = [
      {
        id: "kpi-widget",
        type: "kpi",
        position: 0,
        size: "large",
        isVisible: true,
      },
      {
        id: "agenda-widget",
        type: "agenda",
        position: 1,
        size: "medium",
        isVisible: true,
      },
    ];
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Trial Banner */}
      {subscription && (
        <TrialBanner
          daysRemaining={subscription.days_remaining_in_trial}
          trialEndsAt={subscription.trial_ends_at}
          isTrialActive={subscription.is_trial_active}
          subscriptionStatus={subscription.status}
        />
      )}

      {/* Hero Header - Billing Page Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Overview of your practice metrics, today&apos;s agenda, and key performance indicators.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="default" className="w-full sm:w-auto min-w-0" size="sm">
                <Link href="/cases" className="truncate block min-w-0">
                  <span className="truncate">New case</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto min-w-0" size="sm">
                <Link href="/calendar" className="truncate block min-w-0">
                  <span className="truncate">Schedule hearing</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <DashboardKpiCards kpis={kpis} />

      {/* Practice Overview - In Card Container (Like Billing Page) */}
      <div className="sap-card-success">
        <div className="sap-card-body space-y-4">
          <CustomizableDashboard
            initialWidgets={widgets}
            kpis={kpis}
            hearingsToday={hearingsToday}
            showHeader={true}
          />
        </div>
      </div>
    </div>
  );
}


