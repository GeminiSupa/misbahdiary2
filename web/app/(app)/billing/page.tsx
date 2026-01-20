import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewInvoiceSheet } from "@/components/billing/new-invoice-sheet";
import { InvoiceBoard } from "@/components/billing/invoice-board";
import { BillingStatsCards } from "@/components/billing/billing-stats-cards";
import { buildAgingBuckets } from "@/lib/dashboard/metrics";
import { AgingChartCard } from "@/components/billing/aging-chart-card";
import { Banknote } from "lucide-react";

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
        client:clients ( id, full_name ),
        matter:matters (
          id,
          serial_number,
          case_number,
          court_name
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
    invoices?.map((invoice) => {
      // Get client name from invoice's direct client relationship
      const clientName = invoice.client?.full_name ?? "Unknown client";
      
      // Get matter label - prefer serial_number, then case_number
      const matterLabel = invoice.matter
        ? invoice.matter.serial_number ?? invoice.matter.case_number ?? null
        : null;
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        totalAmount: Number(invoice.total_amount ?? 0),
        amountPaid: Number(invoice.amount_paid ?? 0),
        clientName,
        matterLabel,
      };
    }) ?? [];

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
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Hero Header - SAP Fiori Horizon Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <Banknote className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Billing & Finance</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Generate invoices, track outstanding balances, and convert approved timesheets into billable work.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NewInvoiceSheet
                clients={clientOptions}
                matters={matterOptions}
                unbilledTimeEntries={unbilledEntries}
              />
            </div>
          </div>
        </div>
      </div>

      <BillingStatsCards stats={stats} />

      {/* Invoice list + aging inside cards */}
      <div id="invoice-board" className="sap-card-success">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Invoice ledger</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Full invoice list with filters; creation and edits happen in the side drawer.
              </p>
            </div>
          </div>

          <InvoiceBoard invoices={invoiceItems} />
        </div>
      </div>

      <AgingChartCard data={agingBuckets} />
    </div>
  );
}

