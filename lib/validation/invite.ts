import { z } from "zod";

export const acceptInviteSchema = z
  .object({
    token: z.string().min(10),
    fullName: z.string().min(2, "Full name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
    phone: z.string().optional().or(z.literal("")),
    languagePreference: z.enum(["en", "ur"]).default("en"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type AcceptInviteSchema = z.infer<typeof acceptInviteSchema>;

