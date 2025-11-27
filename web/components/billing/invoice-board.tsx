"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { invoiceStatusOptions, type InvoiceStatusOption } from "@/lib/constants/invoices";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { recordInvoicePayment } from "@/app/(app)/billing/actions";
import { Loader2, Download } from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

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

      <Tabs defaultValue="outstanding" className="mt-2">
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
  const [isPaying, startTransition] = useTransition();
  const outstanding = Math.max(invoice.totalAmount - (invoice.amountPaid ?? 0), 0);
  return (
    <article className="sap-tile space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {invoice.invoiceNumber}
          </p>
          <h3 className="text-base font-semibold text-foreground">
            {invoice.clientName}
          </h3>
        </div>
        <Badge
          variant="outline"
          className={
            "flex items-center gap-1 border-none px-2.5 py-0.5 text-xs font-medium capitalize " +
            getStatusClasses(invoice.status)
          }
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          {statusLabel.get(invoice.status as InvoiceStatusOption) ?? invoice.status}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span>
          Issue date:{" "}
          <span className="font-medium text-foreground">
            {format(parseISO(invoice.issueDate), "dd MMM yyyy")}
          </span>
        </span>
        {invoice.dueDate ? (
          <span>
            Due by:{" "}
            {format(parseISO(invoice.dueDate), "dd MMM yyyy")}
          </span>
        ) : null}
        {invoice.matterLabel ? <span>Matter: {invoice.matterLabel}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-primary font-mono">
        <span>Total: PKR {invoice.totalAmount.toLocaleString()}</span>
        {invoice.amountPaid > 0 ? (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Paid: PKR {invoice.amountPaid.toLocaleString()}
          </span>
        ) : null}
        {outstanding > 0 ? (
          <span className="text-xs font-medium uppercase tracking-wide text-destructive">
            Outstanding: PKR {outstanding.toLocaleString()}
          </span>
        ) : null}
      </div>
      {invoice.status === "sent" || invoice.status === "overdue" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isPaying}
            onClick={() =>
              startTransition(async () => {
                await recordInvoicePayment(invoice.id);
              })
            }
          >
            {isPaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mark paid
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/api/invoices/${invoice.id}/pdf`}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Link>
          </Button>
        </div>
      ) : null}
      {invoice.status !== "sent" && invoice.status !== "overdue" ? (
        <div className="mt-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/api/invoices/${invoice.id}/pdf`}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="sap-subtle text-sm text-muted-foreground">{message}</div>;
}

