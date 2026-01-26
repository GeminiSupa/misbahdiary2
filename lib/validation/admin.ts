import { z } from "zod";

export const createFirmSchema = z.object({
  firmName: z.string().min(2, "Firm name must be at least 2 characters"),
  contactEmail: z.string().email("Enter a valid email address"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  ownerEmail: z.string().email("Enter a valid email address for the firm owner"),
  ownerPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  ownerFullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export type CreateFirmSchema = z.infer<typeof createFirmSchema>;
