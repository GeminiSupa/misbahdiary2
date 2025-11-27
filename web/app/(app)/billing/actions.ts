"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { invoiceStatusOptions } from "@/lib/constants/invoices";
import { createNotificationsForRecipients } from "@/lib/server/notifications";
import { getRecipientIdsForPreference } from "@/lib/server/preferences";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientId: z.string().uuid("Select a client"),
  matterId: z.string().uuid().optional().or(z.literal("")),
  status: z
    .enum(invoiceStatusOptions.map((option) => option.value) as [string, ...string[]])
    .default("draft"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional().or(z.literal("")),
  subtotal: z.number({ coerce: true }).min(0, "Subtotal cannot be negative"),
  taxAmount: z.number({ coerce: true }).min(0).optional().default(0),
  discountAmount: z.number({ coerce: true }).min(0).optional().default(0),
  notes: z.string().optional().or(z.literal("")),
  timeEntryIds: z.array(z.string().uuid()).optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

type ActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createInvoice(values: InvoiceFormValues): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = invoiceSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { message: "You must belong to a firm before creating invoices." };
  }

  let timeEntriesTotal = 0;

  if (payload.timeEntryIds && payload.timeEntryIds.length > 0) {
    const { data: entries } = await supabase
      .from("time_entries")
      .select("amount")
      .in("id", payload.timeEntryIds);

    timeEntriesTotal =
      entries?.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0) ?? 0;
  }

  const subtotal = payload.subtotal + timeEntriesTotal;
  const total =
    subtotal + (payload.taxAmount ?? 0) - (payload.discountAmount ?? 0);

  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      firm_id: profile.firm_id,
      client_id: payload.clientId,
      matter_id: payload.matterId ? payload.matterId : null,
      invoice_number: payload.invoiceNumber,
      status: payload.status,
      issue_date: payload.issueDate,
      due_date: payload.dueDate || null,
      subtotal,
      tax_amount: payload.taxAmount ?? 0,
      discount_amount: payload.discountAmount ?? 0,
      total_amount: total,
      notes: payload.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { message: "Invoice number already exists for this firm." };
    }
    return { message: `Could not create invoice: ${insertError.message}` };
  }

  if (payload.timeEntryIds && payload.timeEntryIds.length > 0) {
    const updateData: Record<string, unknown> = { invoice_id: invoice.id };
    if (payload.matterId) {
      updateData.matter_id = payload.matterId;
    }
    await supabase
      .from("time_entries")
      .update(updateData)
      .in("id", payload.timeEntryIds);
  }

  const recipients = await getRecipientIdsForPreference(
    supabase,
    profile.firm_id,
    "invoice_reminders",
  );

  await createNotificationsForRecipients({
    firmId: profile.firm_id,
    title: "Invoice created",
    message: `Invoice ${payload.invoiceNumber} has been issued.`,
    type: "billing",
    link: "/billing",
    relatedEntity: "invoice",
    relatedId: invoice.id,
  }, recipients);

  revalidatePath("/billing");
  revalidatePath("/cases");

  return { success: true };
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount?: number,
): Promise<ActionState> {
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
    return { message: "Join or create a firm before updating invoices." };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total_amount, invoice_number")
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!invoice) {
    return { message: "Invoice not found." };
  }

  const amountPaid = amount ?? Number(invoice.total_amount ?? 0);

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      amount_paid: amountPaid,
      paid_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id);

  if (updateError) {
    return { message: `Unable to record payment: ${updateError.message}` };
  }

  const recipients = await getRecipientIdsForPreference(
    supabase,
    profile.firm_id,
    "invoice_reminders",
  );

  await createNotificationsForRecipients({
    firmId: profile.firm_id,
    title: "Invoice paid",
    message: `Invoice ${invoice.invoice_number ?? ""} marked as paid.`,
    type: "billing",
    link: "/billing",
    relatedEntity: "invoice",
    relatedId: invoiceId,
  }, recipients);

  revalidatePath("/billing");
  revalidatePath("/dashboard");

  return { success: true };
}

