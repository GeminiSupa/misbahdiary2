import { z } from "zod";

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
  role: z.enum([
    "principal_partner",
    "associate",
    "paralegal",
    "of_counsel",
    "client",
    "staff",
  ]),
});

export type OnboardingSchema = z.infer<typeof onboardingSchema>;

export const roleOptions = [
  {
    value: "principal_partner",
    label: "Principal / Partner",
    description: "Firm owner or managing partner",
  },
  {
    value: "associate",
    label: "Associate",
    description: "Practicing lawyer on the team",
  },
  {
    value: "paralegal",
    label: "Paralegal",
    description: "Supports attorneys with case work",
  },
  {
    value: "of_counsel",
    label: "Of Counsel",
    description: "External counsel collaborating on matters",
  },
  {
    value: "client",
    label: "Client",
    description: "Client-side portal access",
  },
  {
    value: "staff",
    label: "Staff",
    description: "Operations, billing, or admin staff",
  },
] as const;

