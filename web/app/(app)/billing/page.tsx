import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InvoiceForm } from "@/components/billing/invoice-form";
import { InvoiceBoard } from "@/components/billing/invoice-board";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { buildAgingBuckets } from "@/lib/dashboard/metrics";
import { AgingChartCard } from "@/components/billing/aging-chart-card";
import { Banknote, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const metadata: Metadata = {
  title: "Billing • Lawyer Diary",
};

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
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

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      `
        id,
        invoice_number,
        status,
        issue_date,
        due_date,
        total_amount,
        amount_paid,
        client:clients ( full_name ),
        matter:matters (
          serial_number,
          case_number,
          court_name,
          client:clients ( full_name )
        )
      `,
    )
    .eq("firm_id", profile.firm_id)
    .order("issue_date", { ascending: false });

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("firm_id", profile.firm_id)
    .order("full_name");

  const { data: matters } = await supabase
    .from("matters")
    .select("id, serial_number, case_number, court_name, client:clients ( full_name )")
    .eq("firm_id", profile.firm_id)
    .order("serial_number");

  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select(
      `
        id,
        matter:matters ( serial_number, case_number ),
        description,
        amount,
        started_at
      `,
    )
    .eq("firm_id", profile.firm_id)
    .is("invoice_id", null)
    .order("started_at", { ascending: false });

  const invoiceItems =
    invoices?.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      totalAmount: Number(invoice.total_amount ?? 0),
      amountPaid: Number(invoice.amount_paid ?? 0),
      clientName: invoice.client?.full_name ?? "Unknown client",
      matterLabel:
        invoice.matter?.serial_number ??
        invoice.matter?.case_number ??
        invoice.matter?.client?.full_name ??
        null,
    })) ?? [];

  const clientOptions =
    clients?.map((client) => ({
      id: client.id,
      label: client.full_name ?? "Unnamed client",
    })) ?? [];

  const matterOptions =
    matters?.map((matter) => ({
      id: matter.id,
      label: `${matter.serial_number ?? matter.case_number ?? "Matter"} — ${matter.client?.full_name ?? matter.court_name ?? "—"}`,
    })) ?? [];

  const unbilledEntries =
    timeEntries?.map((entry) => ({
      id: entry.id,
      label: `${entry.matter?.serial_number ?? entry.matter?.case_number ?? "Matter"} — PKR ${Number(entry.amount ?? 0).toLocaleString()} (${entry.description ?? "No description"})`,
      amount: Number(entry.amount ?? 0),
    })) ?? [];

  const agingBuckets = buildAgingBuckets(invoices ?? []);

  // Calculate financial KPIs
  const totalPaid =
    invoices?.reduce(
      (sum, invoice) => (invoice.status === "paid" ? sum + Number(invoice.amount_paid ?? 0) : sum),
      0,
    ) ?? 0;

  const outstanding =
    invoices?.reduce((sum, invoice) => {
      if (invoice.status === "sent" || invoice.status === "overdue") {
        const paid = Number(invoice.amount_paid ?? 0);
        const total = Number(invoice.total_amount ?? 0);
        return sum + Math.max(total - paid, 0);
      }
      return sum;
    }, 0) ?? 0;

  const overdueInvoices =
    invoices?.filter((invoice) => invoice.status === "overdue").length ?? 0;

  const upcomingDue =
    invoices?.filter((invoice) => {
      if (!invoice.due_date) return false;
      const dueDate = new Date(invoice.due_date);
      const now = new Date();
      const diff = dueDate.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 7 && (invoice.status === "sent" || invoice.status === "overdue");
    }).length ?? 0;

  const currency = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });

  const stats = [
    {
      label: "Outstanding receivables",
      value: currency.format(outstanding),
      hint: "Across sent and overdue invoices",
    },
    {
      label: "Collected this cycle",
      value: currency.format(totalPaid),
      hint: "Invoices marked as paid",
    },
    {
      label: "Invoices overdue",
      value: overdueInvoices.toString(),
      hint: "Follow up with finance team",
    },
    {
      label: "Due within 7 days",
      value: upcomingDue.toString(),
      hint: "Includes upcoming reminders",
    },
  ];

  const statColors = [
    { bg: "from-blue-500/10 via-blue-600/5", border: "border-blue-200/50", icon: "text-blue-600" },
    { bg: "from-green-500/10 via-green-600/5", border: "border-green-200/50", icon: "text-green-600" },
    { bg: "from-red-500/10 via-red-600/5", border: "border-red-200/50", icon: "text-red-600" },
    { bg: "from-amber-500/10 via-amber-600/5", border: "border-amber-200/50", icon: "text-amber-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-xl backdrop-blur">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 shadow-lg">
              <Banknote className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Billing & Finance</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate invoices, track outstanding balances, and convert approved timesheets into billable work.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New invoice
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>New invoice</SheetTitle>
                </SheetHeader>
                <div className="mt-2 h-full overflow-y-auto">
                  <InvoiceForm
                    clients={clientOptions}
                    matters={matterOptions}
                    unbilledTimeEntries={unbilledEntries}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-teal-400/10 blur-2xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const color = statColors[index % statColors.length];
          return (
            <div
              key={stat.label}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                color.bg,
                color.border
              )}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="relative z-10 space-y-2">
                <TrendingUp className={cn("h-5 w-5", color.icon)} />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </div>
              <div className={cn("absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-xl transition-opacity duration-300 group-hover:opacity-30", color.bg.replace("from-", "bg-"))} />
            </div>
          );
        })}
      </div>

      {/* Invoice list + aging inside cards */}
      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Invoice ledger</h2>
              <p className="text-sm text-muted-foreground">
                Full invoice list with filters; creation and edits happen in the side drawer.
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New invoice
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>New invoice</SheetTitle>
                </SheetHeader>
                <div className="mt-2 h-full overflow-y-auto">
                  <InvoiceForm
                    clients={clientOptions}
                    matters={matterOptions}
                    unbilledTimeEntries={unbilledEntries}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <InvoiceBoard invoices={invoiceItems} />
        </div>
      </div>

      <AgingChartCard data={agingBuckets} />
    </div>
  );
}

