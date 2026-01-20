import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EditInvoiceSheet } from "@/components/billing/edit-invoice-sheet";
import { DeleteInvoiceButton, VoidInvoiceButton } from "@/components/billing/delete-invoice-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, ArrowLeft, Calendar, User, Briefcase, DollarSign, FileText } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { InvoiceFormValues } from "@/app/(app)/billing/actions";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Invoice Details • Lawyer Diary",
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
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
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    redirect("/onboarding");
  }

  // Check permissions - only Firm Owners and Principal Partners can edit invoices
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canEdit = isOwner || profile.role === "principal_partner";

  // Fetch invoice with related data
  const { data: invoice } = await supabase
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
        client:clients ( id, full_name, email, phone ),
        matter:matters (
          id,
          serial_number,
          case_number,
          court_name
        )
      `,
    )
    .eq("id", id)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!invoice) {
    notFound();
  }

  // Fetch clients and matters for edit form
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

  const invoiceFormValues: InvoiceFormValues & { id: string } = {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    clientId: invoice.client?.id ?? "",
    matterId: invoice.matter?.id ?? "",
    status: invoice.status as any,
    issueDate: invoice.issue_date ? invoice.issue_date.slice(0, 10) : "",
    dueDate: invoice.due_date ? invoice.due_date.slice(0, 10) : "",
    subtotal: Number(invoice.subtotal ?? 0),
    taxAmount: Number(invoice.tax_amount ?? 0),
    discountAmount: Number(invoice.discount_amount ?? 0),
    notes: invoice.notes ?? "",
    timeEntryIds: [],
  };

  const outstanding = Math.max(
    Number(invoice.total_amount ?? 0) - Number(invoice.amount_paid ?? 0),
    0,
  );

  const getStatusClasses = (status: string) => {
    if (status === "paid") {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (status === "overdue") {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (status === "sent") {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/billing">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0">
                <Receipt className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  {invoice.invoice_number}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invoice.client?.full_name ?? "Unknown client"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusClasses(invoice.status)}>
                {invoice.status}
              </Badge>
              {canEdit && (
                <EditInvoiceSheet
                  invoiceId={invoice.id}
                  invoice={invoiceFormValues}
                  clients={clientOptions}
                  matters={matterOptions}
                  unbilledTimeEntries={unbilledEntries}
                />
              )}
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/api/invoices/${invoice.id}/pdf`}
                  download={`invoice-${invoice.invoice_number}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </a>
              </Button>
              {canEdit && (
                <>
                  {invoice.status === "sent" || invoice.status === "overdue" ? (
                    <VoidInvoiceButton
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoice_number}
                      status={invoice.status}
                      size="sm"
                    />
                  ) : null}
                  <DeleteInvoiceButton
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoice_number}
                    status={invoice.status}
                    size="sm"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="sap-card">
            <div className="sap-card-body space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Invoice Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Issue Date</p>
                    <p className="text-sm font-medium">
                      {invoice.issue_date
                        ? format(parseISO(invoice.issue_date), "dd MMM yyyy")
                        : "—"}
                    </p>
                  </div>
                </div>
                {invoice.due_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">
                        {format(parseISO(invoice.due_date), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                {invoice.matter && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Matter</p>
                      <p className="text-sm font-medium">
                        {invoice.matter.serial_number ??
                          invoice.matter.case_number ??
                          invoice.matter.court_name ??
                          "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sap-card">
            <div className="sap-card-body space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Client Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client Name</p>
                    <p className="text-sm font-medium">
                      {invoice.client?.full_name ?? "—"}
                    </p>
                  </div>
                </div>
                {invoice.client?.email && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{invoice.client.email}</p>
                    </div>
                  </div>
                )}
                {invoice.client?.phone && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{invoice.client.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="sap-card">
            <div className="sap-card-body space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Financial Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">
                    PKR {Number(invoice.subtotal ?? 0).toLocaleString()}
                  </span>
                </div>
                {Number(invoice.tax_amount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tax</span>
                    <span className="text-sm font-medium">
                      PKR {Number(invoice.tax_amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {Number(invoice.discount_amount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Discount</span>
                    <span className="text-sm font-medium">
                      PKR {Number(invoice.discount_amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-primary">
                      PKR {Number(invoice.total_amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                {Number(invoice.amount_paid ?? 0) > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Amount Paid</span>
                    <span className="text-sm font-medium text-green-600">
                      PKR {Number(invoice.amount_paid ?? 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {outstanding > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Outstanding</span>
                    <span className="text-sm font-medium text-red-600">
                      PKR {outstanding.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="sap-card">
              <div className="sap-card-body space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
