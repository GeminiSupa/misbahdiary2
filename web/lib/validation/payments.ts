import { z } from "zod";

export const paymentSchema = z.object({
  matterId: z.string().uuid("Invalid matter ID"),
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .max(999999999999.99, "Amount is too large"),
  date: z.string().min(1, "Date is required"),
  method: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

