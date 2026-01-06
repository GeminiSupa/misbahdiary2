import { z } from "zod";
import { hearingStatusOptions } from "@/lib/constants/hearings";

export const scheduleValidationSchema = z.object({
  matterId: z.string().uuid({ message: "Select a matter" }),
  scheduledAt: z.string().min(1, "Choose a date and time"),
  durationMinutes: z.coerce
    .number()
    .min(5, "Duration must be greater than 0"),
  location: z.string().optional().or(z.literal("")),
  status: z
    .enum(hearingStatusOptions.map((option) => option.value) as [string, ...string[]])
    .default("scheduled"),
  notes: z.string().optional().or(z.literal("")),
});

export const updateSchema = scheduleValidationSchema.extend({
  hearingId: z.string().uuid("Missing hearing id"),
});

export type ScheduleValidationSchema = z.infer<typeof scheduleValidationSchema>;
export type UpdateHearingSchema = z.infer<typeof updateSchema>;

