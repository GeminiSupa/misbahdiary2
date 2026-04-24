import { z } from "zod";

export const ONBOARDING_ACCOUNT_ROLE = "principal_partner" as const;

export const onboardingSchema = z.object({
  firmName: z.string().min(2, "Firm name must be at least 2 characters"),
  contactEmail: z.string().email("Provide a valid email address"),
  contactPhone: z
    .string()
    .min(6, "Provide a valid contact number")
    .max(20, "Contact number looks too long")
    .optional()
    .or(z.literal("")),
  fullName: z.string().min(2, "Your name must be at least 2 characters"),
});

export type OnboardingSchema = z.infer<typeof onboardingSchema>;

