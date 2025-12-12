import { z } from "zod";

export const caseHistorySchema = z.object({
  matterId: z.string().uuid("Invalid matter ID"),
  date: z.string().min(1, "Date is required"),
  details: z.string().min(1, "Details are required").max(5000, "Details must be less than 5000 characters"),
  stage: z.string().optional().or(z.literal("")),
  courtName: z.string().optional().or(z.literal("")),
  hearingDate: z.string().optional().or(z.literal("")),
  caseNumber: z.string().optional().or(z.literal("")),
  nextHearingReason: z.string().optional().or(z.literal("")),
});

export type CaseHistoryFormValues = z.infer<typeof caseHistorySchema>;

