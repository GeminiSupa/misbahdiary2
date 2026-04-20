"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { invoiceStatusOptions } from "@/lib/constants/invoices";
import { createNotificationsForRecipients } from "@/lib/server/notifications";
import { getRecipientIdsForPreference } from "@/lib/server/preferences";
import { sendClientEmail, sendFirmEmailByPreference } from "@/lib/server/notification-email";

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientId: z.string().uuid("Select a client"),
  matterId: z.string().uuid().optional().or(z.literal("")),
  status: z
    .enum(invoiceStatusOptions.map((option) => option.value) as [string, ...string[]])
    .default("draft"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional().or(z.literal("")),
  subtotal: z.coerce.number().min(0, "Subtotal cannot be negative"),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
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
    // Cast to any to avoid drift between runtime schema and generated types
    .insert({
      firm_id: profile.firm_id,
      client_id: payload.clientId,
      matter_id: payload.matterId ? payload.matterId : null,
      invoice_number: payload.invoiceNumber,
      status: payload.status as any,
      issue_date: payload.issueDate,
      due_date: payload.dueDate || null,
      subtotal,
      tax_amount: payload.taxAmount ?? 0,
      discount_amount: payload.discountAmount ?? 0,
      total_amount: total,
      notes: payload.notes || null,
      created_by: user.id,
    } as any)
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

  void sendFirmEmailByPreference({
    firmId: profile.firm_id,
    preference: "invoice_reminders",
    subject: `Invoice created (${payload.invoiceNumber})`,
    text: `Invoice ${payload.invoiceNumber} was created.`,
    linkPath: "/billing",
  });
  void sendClientEmail({
    clientId: payload.clientId,
    subject: `Invoice ${payload.invoiceNumber} issued`,
    text: `A new invoice (${payload.invoiceNumber}) has been issued for you. Please check your client portal for details.`,
    linkPath: "/client/dashboard",
  });

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

  void sendFirmEmailByPreference({
    firmId: profile.firm_id,
    preference: "invoice_reminders",
    subject: `Invoice paid (${invoice.invoice_number ?? ""})`,
    text: `Invoice ${invoice.invoice_number ?? ""} was marked as paid.`,
    linkPath: "/billing",
  });

  // Email client if invoice is linked to a client (always true here).
  const { data: invoiceClient } = await supabase
    .from("invoices")
    .select("client_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (invoiceClient?.client_id) {
    void sendClientEmail({
      clientId: String(invoiceClient.client_id),
      subject: `Payment received for invoice ${invoice.invoice_number ?? ""}`,
      text: `Payment was recorded for invoice ${invoice.invoice_number ?? ""}.`,
      linkPath: "/client/dashboard",
    });
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateInvoice(
  invoiceId: string,
  values: InvoiceFormValues,
): Promise<ActionState> {
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
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { message: "You must belong to a firm before updating invoices." };
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canEdit = isOwner || profile.role === "principal_partner";

  if (!canEdit) {
    return { message: "Only Firm Owners and Principal Partners can edit invoices." };
  }

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id, firm_id, invoice_number")
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!existingInvoice) {
    return { message: "Invoice not found or you do not have access." };
  }

  if (payload.invoiceNumber !== existingInvoice.invoice_number) {
    const { data: duplicateCheck } = await supabase
      .from("invoices")
      .select("id")
      .eq("firm_id", profile.firm_id)
      .eq("invoice_number", payload.invoiceNumber)
      .neq("id", invoiceId)
      .maybeSingle();

    if (duplicateCheck) {
      return { message: "Invoice number already exists for this firm." };
    }
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

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      client_id: payload.clientId,
      matter_id: payload.matterId ? payload.matterId : null,
      invoice_number: payload.invoiceNumber,
      status: payload.status as any,
      issue_date: payload.issueDate,
      due_date: payload.dueDate || null,
      subtotal,
      tax_amount: payload.taxAmount ?? 0,
      discount_amount: payload.discountAmount ?? 0,
      total_amount: total,
      notes: payload.notes || null,
    } as any)
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id);

  if (updateError) {
    return { message: `Could not update invoice: ${updateError.message}` };
  }

  const newTimeEntryIds = new Set(payload.timeEntryIds ?? []);
  const { data: previouslyLinked } = await supabase
    .from("time_entries")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("firm_id", profile.firm_id);

  const toUnlink = previouslyLinked?.filter((e) => !newTimeEntryIds.has(e.id)).map((e) => e.id) ?? [];
  if (toUnlink.length > 0) {
    await supabase
      .from("time_entries")
      .update({ invoice_id: null } as any)
      .in("id", toUnlink);
  }

  if (newTimeEntryIds.size > 0) {
    await supabase
      .from("time_entries")
      .update({ invoice_id: invoiceId } as any)
      .in("id", Array.from(newTimeEntryIds));
  }

  revalidatePath("/billing");

  return { success: true };
}

export async function deleteInvoice(invoiceId: string): Promise<ActionState> {
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
    return { message: "Join or create a firm before managing invoices." };
  }

  // Check permissions - only Firm Owners and Principal Partners can delete invoices
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canDelete = isOwner || profile.role === "principal_partner";

  if (!canDelete) {
    return { message: "Only Firm Owners and Principal Partners can delete invoices." };
  }

  // Check if invoice exists and belongs to the firm
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, firm_id, status, invoice_number")
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!invoice) {
    return { message: "Invoice not found or you do not have access." };
  }

  // Only allow deletion of draft invoices
  if (invoice.status !== "draft") {
    return {
      message: `Cannot delete invoice. Only draft invoices can be deleted. This invoice is ${invoice.status}. To remove a sent or paid invoice, mark it as void instead.`,
    };
  }

  // Unlink associated time entries
  await supabase
    .from("time_entries")
    .update({ invoice_id: null })
    .eq("invoice_id", invoiceId);

  // Delete invoice
  const { error: deleteError } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id);

  if (deleteError) {
    return { message: `Could not delete invoice: ${deleteError.message}` };
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function voidInvoice(invoiceId: string): Promise<ActionState> {
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
    return { message: "Join or create a firm before managing invoices." };
  }

  // Check permissions - only Firm Owners and Principal Partners can void invoices
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canVoid = isOwner || profile.role === "principal_partner";

  if (!canVoid) {
    return { message: "Only Firm Owners and Principal Partners can void invoices." };
  }

  // Check if invoice exists and belongs to the firm
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, firm_id, status, invoice_number")
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!invoice) {
    return { message: "Invoice not found or you do not have access." };
  }

  // Cannot void already voided invoices
  if (invoice.status === "void") {
    return { message: "Invoice is already voided." };
  }

  // Update invoice status to void
  const { error: updateError } = await supabase
    .from("invoices")
    .update({ status: "void" })
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id);

  if (updateError) {
    return { message: `Could not void invoice: ${updateError.message}` };
  }

  revalidatePath("/billing");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deletePayment(paymentId: string, invoiceId: string): Promise<ActionState> {
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
    return { message: "Join or create a firm before managing payments." };
  }

  // Check permissions - only Firm Owners and Principal Partners can delete payments
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canDelete = isOwner || profile.role === "principal_partner";

  if (!canDelete) {
    return { message: "Only Firm Owners and Principal Partners can delete payments." };
  }

  // Verify invoice belongs to firm
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, firm_id, amount_paid, total_amount")
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!invoice) {
    return { message: "Invoice not found or you do not have access." };
  }

  // Note: Payments are stored in finances table, not a separate payments table
  // Check if payment exists in finances table
  const { data: paymentData } = await supabase
    .from("finances")
    .select("id, firm_id, matter_id, amount, type")
    .eq("id", paymentId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!paymentData) {
    return { message: "Payment not found or you do not have access." };
  }
  
  // Type assertion to handle schema mismatch - cast through unknown first
  const payment = paymentData as unknown as { id: string; firm_id: string; matter_id?: string | null; amount?: number | null; type: string };

  // Get payment amount before deletion for recalculation
  const paymentAmount = Number(payment.amount ?? 0);
  const currentAmountPaid = Number(invoice.amount_paid ?? 0);

  // Delete payment record
  const { error: deleteError } = await supabase
    .from("finances")
    .delete()
    .eq("id", paymentId)
    .eq("firm_id", profile.firm_id);

  if (deleteError) {
    return { message: `Could not delete payment: ${deleteError.message}` };
  }

  // Recalculate invoice amount_paid by subtracting the deleted payment amount
  const newAmountPaid = Math.max(0, currentAmountPaid - paymentAmount);
  const totalAmount = Number(invoice.total_amount ?? 0);

  // Determine new status based on payment amount
  let newStatus: string;
  if (newAmountPaid >= totalAmount) {
    newStatus = "paid";
  } else if (newAmountPaid > 0) {
    newStatus = "sent";
  } else {
    // If no payment, check if invoice was already sent or keep as draft
    // Get current invoice status to determine if it should be "sent" or "draft"
    const { data: currentInvoice } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", invoiceId)
      .single();
    
    // If invoice was already sent/paid, keep it as "sent", otherwise "draft"
    newStatus = currentInvoice?.status === "draft" ? "draft" : "sent";
  }

  // Update invoice amount_paid and status
  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      status: newStatus as any,
      paid_at: newAmountPaid > 0 ? new Date().toISOString() : null,
    })
    .eq("id", invoiceId)
    .eq("firm_id", profile.firm_id);

  if (updateError) {
    console.error("Error updating invoice after payment deletion:", updateError);
    return { message: `Payment deleted but failed to update invoice: ${updateError.message}` };
  }

  revalidatePath("/billing");
  revalidatePath("/cases");
  if (payment && payment.matter_id) {
    revalidatePath(`/cases/${String(payment.matter_id)}`);
  }

  return { success: true };
}
