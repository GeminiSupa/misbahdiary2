import { z } from "zod";

export const feeTotalSchema = z.object({
  matterId: z.string().uuid("Invalid matter ID"),
  feeTotal: z
    .number({ required_error: "Fee total is required" })
    .min(0, "Fee total cannot be negative")
    .max(999999999999.99, "Fee total is too large"),
});

export type FeeTotalFormValues = z.infer<typeof feeTotalSchema>;

