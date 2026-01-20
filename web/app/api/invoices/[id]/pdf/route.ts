import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-pdf";
import { createElement } from "react";

const dateFormatter = new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" });

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const invoiceId = id;

  const { data: invoice } = await supabaseAdminClient
    .from("invoices")
    .select(
      `
        id,
        firm_id,
        client_id,
        invoice_number,
        issue_date,
        due_date,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        amount_paid,
        notes,
        client:clients ( full_name, email, phone ),
        firm:firms ( name, address ),
        matter:matters ( serial_number, case_number, court_name )
      `,
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  const { data: timeEntries } = await supabaseAdminClient
    .from("time_entries")
    .select("description, amount")
    .eq("invoice_id", invoiceId);

  const lineItems = (timeEntries ?? []).map((entry, index) => ({
    label: entry.description ?? `Time entry ${index + 1}`,
    amount: Number(entry.amount ?? 0),
  }));

  if (lineItems.length === 0) {
    lineItems.push({ label: "Professional services", amount: Number(invoice.subtotal ?? 0) });
  }

  const issueDateFormatted = invoice.issue_date
    ? dateFormatter.format(new Date(invoice.issue_date))
    : "-";
  const dueDateFormatted = invoice.due_date ? dateFormatter.format(new Date(invoice.due_date)) : null;

  const pdfElement = createElement(InvoicePdfDocument, {
    firmName: invoice.firm?.name ?? "Lawyer Diary",
    firmAddress: invoice.firm?.address ?? undefined,
    invoiceNumber: invoice.invoice_number,
    issueDate: issueDateFormatted,
    dueDate: dueDateFormatted ?? undefined,
    clientName: invoice.client?.full_name ?? "Client",
    clientEmail: invoice.client?.email ?? undefined,
    clientPhone: invoice.client?.phone ?? undefined,
    notes: invoice.notes ?? undefined,
    matterReference:
      invoice.matter?.serial_number ?? invoice.matter?.case_number ?? invoice.matter?.court_name ?? undefined,
    subtotal: Number(invoice.subtotal ?? 0),
    taxAmount: Number(invoice.tax_amount ?? 0),
    discountAmount: Number(invoice.discount_amount ?? 0),
    totalAmount: Number(invoice.total_amount ?? 0),
    amountPaid: Number(invoice.amount_paid ?? 0),
    lineItems,
  });

  const stream = await renderToStream(pdfElement as any);

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

