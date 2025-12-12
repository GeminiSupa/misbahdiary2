import { z } from "zod";
import {
  clientTypeOptions,
  clientRepresentationOptions,
  representativeCapacityOptions,
} from "@/lib/constants/clients";

const cnicRegex = /^\d{13}$/;

export const clientSchemaForForm = z
  .object({
    id: z.string().uuid().optional(),
    type: z
      .enum(clientTypeOptions.map((option) => option.value) as [string, ...string[]])
      .default("individual"),
    fullName: z.string().min(2, "Full name is required"),
    fatherName: z.string().min(2, "Father/guardian name is required"),
    address: z.string().min(5, "Address is required"),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z.string().max(25, "Phone number is too long").optional().or(z.literal("")),
    cnic: z
      .string()
      .refine((val) => !val || cnicRegex.test(val), {
        message: "CNIC must be 13 digits",
      })
      .optional()
      .or(z.literal("")),
    representation: z
      .enum(clientRepresentationOptions.map((option) => option.value) as [string, ...string[]])
      .default("self"),
    representativeToWhom: z.string().optional().or(z.literal("")),
    representativeCapacity: z
      .enum(
        representativeCapacityOptions.map((option) => option.value) as [string, ...string[]],
      )
      .optional()
      .or(z.literal("")),
    organizationName: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    province: z.string().optional().or(z.literal("")),
    country: z.string().optional().or(z.literal("Pakistan")),
    notes: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.representation === "representative") {
      if (!data.representativeToWhom) {
        ctx.addIssue({
          path: ["representativeToWhom"],
          code: z.ZodIssueCode.custom,
          message: "Please specify who the client represents.",
        });
      }
      if (!data.representativeCapacity) {
        ctx.addIssue({
          path: ["representativeCapacity"],
          code: z.ZodIssueCode.custom,
          message: "Select a capacity for the representative.",
        });
      }
    }
  });

export type ClientSchemaForForm = z.infer<typeof clientSchemaForForm>;

