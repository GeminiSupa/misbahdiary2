import { z } from "zod";
import { invoiceStatusOptions } from "@/lib/constants/invoices";

export const invoiceFormSchema = z.object({
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

export type InvoiceFormSchema = z.infer<typeof invoiceFormSchema>;

