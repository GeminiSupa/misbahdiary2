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

  // STRICT BLOCKING: Enforce subscription access (backup to middleware)
  const { enforceSubscriptionAccess } = await import("@/lib/server/subscription-check");
  await enforceSubscriptionAccess(profile.firm_id);

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      `
        id,
        invoice_number,
        status,
        issue_date,
        due_date,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        amount_paid,
        notes,
        client_id,
        matter_id,
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
        started_at,
        invoice_id
      `,
    )
    .eq("firm_id", profile.firm_id)
    .order("started_at", { ascending: false });

  const unbilledEntries =
    timeEntries?.filter((e) => !e.invoice_id).map((entry) => ({
      id: entry.id,
      label: `${entry.matter?.serial_number ?? entry.matter?.case_number ?? "Matter"} — PKR ${Number(entry.amount ?? 0).toLocaleString()} (${entry.description ?? "No description"})`,
      amount: Number(entry.amount ?? 0),
    })) ?? [];

  const linkedByInvoice = new Map<string, Array<{ id: string; label: string; amount: number }>>();
  timeEntries?.filter((e) => e.invoice_id).forEach((entry) => {
    const invId = entry.invoice_id as string;
    if (!linkedByInvoice.has(invId)) {
      linkedByInvoice.set(invId, []);
    }
    linkedByInvoice.get(invId)!.push({
      id: entry.id,
      label: `${entry.matter?.serial_number ?? entry.matter?.case_number ?? "Matter"} — PKR ${Number(entry.amount ?? 0).toLocaleString()} (${entry.description ?? "No description"})`,
      amount: Number(entry.amount ?? 0),
    });
  });

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
        clientId: invoice.client_id,
        matterId: invoice.matter_id ?? "",
        subtotal: Number(invoice.subtotal ?? 0),
        taxAmount: Number(invoice.tax_amount ?? 0),
        discountAmount: Number(invoice.discount_amount ?? 0),
        notes: (invoice as { notes?: string | null }).notes ?? "",
        timeEntryIds: linkedByInvoice.get(invoice.id)?.map((e) => e.id) ?? [],
        linkedTimeEntries: linkedByInvoice.get(invoice.id) ?? [],
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
    <div className="-mx-4 rounded-3xl bg-linear-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-6 lg:mx-0 lg:px-0">
      <div className="space-y-3 sm:space-y-4 lg:px-4">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-200">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight sm:text-lg">Billing & Finance</h1>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-300/80">
                  Generate invoices, track balances, and convert time entries into billable work.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <NewInvoiceSheet
                clients={clientOptions}
                matters={matterOptions}
                unbilledTimeEntries={unbilledEntries}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-5">
          <BillingStatsCards stats={stats} />
        </div>

        <div
          id="invoice-board"
          className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-5"
        >
          <div className="mb-3">
            <h2 className="text-base font-black tracking-tight text-slate-100 sm:text-lg">
              Invoice ledger
            </h2>
            <p className="mt-0.5 text-xs text-slate-300/80">
              Filter invoices, open details, and create new invoices from the side drawer.
            </p>
          </div>

          <InvoiceBoard
            invoices={invoiceItems}
            clients={clientOptions}
            matters={matterOptions}
            unbilledTimeEntries={unbilledEntries}
          />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-5">
          <AgingChartCard data={agingBuckets} />
        </div>
      </div>
    </div>
  );
}

