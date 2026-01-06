import { z } from "zod";

export const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().optional().or(z.literal("")),
  languagePreference: z.enum(["en", "ur"]).default("en"),
});

export const firmFormSchema = z.object({
  name: z.string().min(2, "Firm name is required"),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export const invitationFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum([
    "principal_partner",
    "associate",
    "paralegal",
    "of_counsel",
    "client",
    "staff",
  ]),
});

export const notificationPreferencesSchema = z.object({
  hearingReminders: z.boolean(),
  invoiceReminders: z.boolean(),
  announcementUpdates: z.boolean(),
});

export type ProfileFormSchema = z.infer<typeof profileFormSchema>;
export type FirmFormSchema = z.infer<typeof firmFormSchema>;
export type InvitationFormSchema = z.infer<typeof invitationFormSchema>;
export type NotificationPreferencesSchema = z.infer<typeof notificationPreferencesSchema>;

