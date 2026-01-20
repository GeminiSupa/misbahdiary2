import { z } from "zod";

export const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().optional().or(z.literal("")),
  languagePreference: z.enum(["en", "ur"]).default("en"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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

export const billingSettingsSchema = z.object({
  invoicePrefix: z.string().min(1, "Invoice prefix is required").max(10, "Prefix too long"),
  invoiceNumberFormat: z.enum(["YYYY-####", "####", "INV-YYYY-####", "INV-####"]),
  nextInvoiceNumber: z.coerce.number().int().min(1, "Next invoice number must be at least 1").default(1),
  defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365).default(30),
  defaultCurrency: z.string().default("PKR"),
  salesTaxRate: z.coerce.number().min(0).max(100).optional().default(18.00),
  salesTaxLabel: z.string().optional().default("GST"),
  taxRegistrationNumber: z.string().optional().or(z.literal("")),
  salesTaxRegistrationNumber: z.string().optional().or(z.literal("")),
  paymentMethods: z.array(z.string()).min(1, "At least one payment method is required"),
  bankName: z.string().optional().or(z.literal("")),
  accountTitle: z.string().optional().or(z.literal("")),
  accountNumber: z.string().optional().or(z.literal("")),
  iban: z.string().optional().or(z.literal("")),
  swiftCode: z.string().optional().or(z.literal("")),
  branchCode: z.string().optional().or(z.literal("")),
  branchAddress: z.string().optional().or(z.literal("")),
  invoiceFooter: z.string().optional().or(z.literal("")),
  invoiceNotes: z.string().optional().or(z.literal("")),
  autoGenerateInvoiceNumber: z.boolean().default(true),
});

export type ProfileFormSchema = z.infer<typeof profileFormSchema>;
export type FirmFormSchema = z.infer<typeof firmFormSchema>;
export type InvitationFormSchema = z.infer<typeof invitationFormSchema>;
export type NotificationPreferencesSchema = z.infer<typeof notificationPreferencesSchema>;
export type BillingSettingsSchema = z.infer<typeof billingSettingsSchema>;

