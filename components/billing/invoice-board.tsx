"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { invoiceStatusOptions, type InvoiceStatusOption } from "@/lib/constants/invoices";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recordInvoicePayment } from "@/app/(app)/billing/actions";
import { Loader2, Download } from "lucide-react";
import { DeleteInvoiceButton, VoidInvoiceButton } from "@/components/billing/delete-invoice-button";
import { useRouter } from "next/navigation";

type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  matterLabel: string | null;
  status: string;
  issueDate: string;
  dueDate: string | null;
  totalAmount: number;
  amountPaid: number;
};

type InvoiceBoardProps = {
  invoices: InvoiceRecord[];
};

export function InvoiceBoard({ invoices }: InvoiceBoardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [defaultTab, setDefaultTab] = useState<string>("outstanding");

  // Listen for tab change events from stat cards
  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail) {
        setDefaultTab(customEvent.detail);
      }
    };
    window.addEventListener("setInvoiceTab", handleTabChange);
    return () => {
      window.removeEventListener("setInvoiceTab", handleTabChange);
    };
  }, []);

  const statusLabel = useMemo(
    () => new Map(invoiceStatusOptions.map((option) => [option.value, option.label])),
    [],
  );

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesQuery =
        !query ||
        [invoice.invoiceNumber, invoice.clientName, invoice.matterLabel ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesStatus = status === "all" || invoice.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, status]);

  const grouped = useMemo(() => {
    const outstanding = filtered.filter(
      (invoice) => invoice.status === "sent" || invoice.status === "overdue",
    );
    const paid = filtered.filter((invoice) => invoice.status === "paid");
    const drafts = filtered.filter((invoice) => invoice.status === "draft");
    const voided = filtered.filter((invoice) => invoice.status === "void");
    return { outstanding, paid, drafts, voided };
  }, [filtered]);

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Invoices</h2>
            <p className="text-sm text-muted-foreground">
              Track billed work, monitor outstanding balances, and maintain payment history.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search invoices..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full sm:w-48"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner sm:w-40"
            >
              <option value="all">All statuses</option>
              {invoiceStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {(query || status !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

      <Tabs value={defaultTab} onValueChange={setDefaultTab} className="mt-2">
        <TabsList className="grid w-full grid-cols-4 rounded-full bg-muted/60">
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="voided">Void</TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding" className="mt-4 space-y-3">
          {grouped.outstanding.length > 0 ? (
            grouped.outstanding.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} statusLabel={statusLabel} />
            ))
          ) : (
            <Empty message="No outstanding invoices." />
          )}
        </TabsContent>

        <TabsContent value="paid" className="mt-4 space-y-3">
          {grouped.paid.length > 0 ? (
            grouped.paid.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} statusLabel={statusLabel} />
            ))
          ) : (
            <Empty message="No paid invoices yet." />
          )}
        </TabsContent>

        <TabsContent value="drafts" className="mt-4 space-y-3">
          {grouped.drafts.length > 0 ? (
            grouped.drafts.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} statusLabel={statusLabel} />
            ))
          ) : (
            <Empty message="No draft invoices." />
          )}
        </TabsContent>

        <TabsContent value="voided" className="mt-4 space-y-3">
          {grouped.voided.length > 0 ? (
            grouped.voided.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} statusLabel={statusLabel} />
            ))
          ) : (
            <Empty message="No void invoices." />
          )}
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}

function getStatusClasses(status: string) {
  if (status === "paid") {
    return "bg-[var(--success-soft)] text-[var(--success)]";
  }
  if (status === "overdue") {
    return "bg-[var(--destructive-soft)] text-[var(--destructive)]";
  }
  if (status === "sent") {
    return "bg-[var(--warning-soft)] text-[var(--warning)]";
  }
  if (status === "draft") {
    return "bg-[var(--muted-soft)] text-slate-600";
  }
  return "bg-[var(--muted-soft)] text-slate-600";
}

function InvoiceCard({
  invoice,
  statusLabel,
}: {
  invoice: InvoiceRecord;
  statusLabel: Map<InvoiceStatusOption, string>;
}) {
  const router = useRouter();
  const [isPaying, startTransition] = useTransition();
  const outstanding = Math.max(invoice.totalAmount - (invoice.amountPaid ?? 0), 0);
  
  return (
    <article 
      className="sap-tile space-y-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/20 overflow-hidden"
      onClick={(e) => {
        // Don't navigate if clicking on buttons
        if ((e.target as HTMLElement).closest('button, a')) {
          return;
        }
        // Navigate to invoice detail page (if exists) or open in drawer
        router.push(`/billing?invoice=${invoice.id}`);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
            {invoice.invoiceNumber}
          </p>
          <h3 className="text-base font-semibold text-foreground truncate" title={invoice.clientName}>
            {invoice.clientName}
          </h3>
        </div>
        <Badge
          variant="outline"
          className={
            "flex items-center gap-1 border-none px-2.5 py-0.5 text-xs font-medium capitalize shrink-0 whitespace-nowrap " +
            getStatusClasses(invoice.status)
          }
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80 shrink-0" />
          {statusLabel.get(invoice.status as InvoiceStatusOption) ?? invoice.status}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="truncate max-w-full">
          Issue date:{" "}
          <span className="font-medium text-foreground">
            {format(parseISO(invoice.issueDate), "dd MMM yyyy")}
          </span>
        </span>
        {invoice.dueDate ? (
          <span className="truncate max-w-full">
            Due by:{" "}
            {format(parseISO(invoice.dueDate), "dd MMM yyyy")}
          </span>
        ) : null}
        {invoice.matterLabel ? <span className="truncate max-w-full" title={`Matter: ${invoice.matterLabel}`}>Matter: {invoice.matterLabel}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-primary font-mono">
        <span className="truncate">Total: PKR {invoice.totalAmount.toLocaleString()}</span>
        {invoice.amountPaid > 0 ? (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
            Paid: PKR {invoice.amountPaid.toLocaleString()}
          </span>
        ) : null}
        {outstanding > 0 ? (
          <span className="text-xs font-medium uppercase tracking-wide text-destructive truncate">
            Outstanding: PKR {outstanding.toLocaleString()}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {invoice.status === "sent" || invoice.status === "overdue" ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isPaying}
              onClick={() =>
                startTransition(async () => {
                  await recordInvoicePayment(invoice.id);
                })
              }
              className="flex-shrink-0"
            >
              {isPaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <span className="hidden sm:inline">Mark paid</span>
              <span className="sm:hidden">Paid</span>
            </Button>
            <VoidInvoiceButton
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              status={invoice.status}
              size="sm"
            />
          </>
        ) : null}
        <DeleteInvoiceButton
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          status={invoice.status}
          size="sm"
        />
        <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            download={`invoice-${invoice.invoiceNumber}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </a>
        </Button>
      </div>
    </article>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="sap-subtle text-sm text-muted-foreground">{message}</div>;
}

