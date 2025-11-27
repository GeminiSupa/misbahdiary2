"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createMatter, type MatterFormValues } from "@/app/(app)/cases/actions";
import {
  matterStatusOptions,
  matterTypeOptions,
  matterCaseTypeOptions,
  matterPartyTypeOptions,
} from "@/lib/constants/cases";
import { pakistanCourtOptions, pakistanDistrictOptions } from "@/lib/constants/geo";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

const formSchema = z
  .object({
    clientId: z.string().uuid({ message: "Select a client" }),
    matterType: z
      .enum(matterTypeOptions.map((option) => option.value) as [string, ...string[]])
      .default("litigation"),
    matterStatus: z
      .enum(matterStatusOptions.map((option) => option.value) as [string, ...string[]])
      .default("fresh diary"),
    caseNumber: z.string().optional().or(z.literal("")),
    caseFileDate: z.string().optional().or(z.literal("")),
    caseType: z
      .enum(matterCaseTypeOptions.map((option) => option.value) as [string, ...string[]])
      .optional()
      .or(z.literal("")),
    courtName: z.string().min(2, "Court is required"),
    district: z.string().min(2, "District is required"),
    clientBrief: z.string().optional().or(z.literal("")),
    againstParties: z.string().optional().or(z.literal("")),
    againstPartiesType: z
      .enum(matterPartyTypeOptions.map((option) => option.value) as [string, ...string[]])
      .default("individual"),
    evidenceProvided: z.string().optional().or(z.literal("")),
    documentsProvided: z.string().optional().or(z.literal("")),
    pendingDocuments: z.string().optional().or(z.literal("")),
    assignedAttorneys: z.array(z.string().uuid()).default([] as string[]),
  })
  .superRefine((data, ctx) => {
    if (data.matterType === "litigation") {
      if (!data.caseType) {
        ctx.addIssue({
          path: ["caseType"],
          code: z.ZodIssueCode.custom,
          message: "Select a case type for litigation matters.",
        });
      }
      if (!data.caseFileDate) {
        ctx.addIssue({
          path: ["caseFileDate"],
          code: z.ZodIssueCode.custom,
          message: "Provide the court filing date.",
        });
      }
    }
  });

type Props = {
  clients: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; name: string }>;
};

export function CaseForm({ clients, staff }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<MatterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      matterType: "litigation",
      matterStatus: "fresh diary",
      caseNumber: "",
      caseFileDate: "",
      caseType: "",
      courtName: pakistanCourtOptions[0] ?? "",
      district: pakistanDistrictOptions[0] ?? "",
      clientBrief: "",
      againstParties: "",
      againstPartiesType: "individual",
      evidenceProvided: "",
      documentsProvided: "",
      pendingDocuments: "",
      assignedAttorneys: [],
    },
  });

  const selectedMatterType = useWatch({ control: form.control, name: "matterType" });

  const onSubmit = async (values: MatterFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await createMatter({
      ...values,
      caseNumber: values.caseNumber || undefined,
      caseFileDate: values.caseFileDate || undefined,
      caseType: values.caseType || undefined,
      clientBrief: values.clientBrief || undefined,
      againstParties: values.againstParties || undefined,
      evidenceProvided: values.evidenceProvided || undefined,
      documentsProvided: values.documentsProvided || undefined,
      pendingDocuments: values.pendingDocuments || undefined,
      assignedAttorneys:
        Array.isArray(values.assignedAttorneys) && values.assignedAttorneys.length > 0
          ? values.assignedAttorneys
          : [],
    });

    if (result.success) {
      form.reset();
      router.refresh();
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as keyof MatterFormValues, {
            type: "server",
            message,
          });
        }
      });
    }

    if (result.message) {
      setFormError(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not create matter</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="sap-form space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(
                        "block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      <option value="">Select client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedAttorneys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned attorneys</FormLabel>
                  <FormControl>
                    <select
                      multiple
                      value={Array.isArray(field.value) ? field.value : []}
                      onChange={(event) => {
                        const selected = Array.from(event.target.selectedOptions).map(
                          (option) => option.value,
                        );
                        field.onChange(selected);
                      }}
                      className={cn(
                        "block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      {staff.length === 0 ? (
                        <option disabled>No staff yet</option>
                      ) : null}
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="matterType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matter type</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {matterTypeOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "rounded-lg border px-3 py-1 text-sm transition",
                            field.value === option.value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/60",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matterStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(
                        "block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      {matterStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="caseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case number (court assigned)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional until court allocates" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="courtName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Court</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(
                        "block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      {pakistanCourtOptions.map((court) => (
                        <option key={court} value={court}>
                          {court}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(
                        "block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      {pakistanDistrictOptions.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="caseFileDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case file date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {selectedMatterType === "litigation" ? (
            <FormField
              control={form.control}
              name="caseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Litigation case type</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(
                        "block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      <option value="">Select type</option>
                      {matterCaseTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="clientBrief"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client brief</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Summarize the facts, relief sought, and mandates provided by the client."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="againstParties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opposing parties</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="List parties involved against your client."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="againstPartiesType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party type</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(
                        "block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      {matterPartyTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="evidenceProvided"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence provided</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Separate each item on a new line."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentsProvided"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documents uploaded</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="List key documents linked in Supabase storage."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="pendingDocuments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pending documentation</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="List items outstanding from the client."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save matter
          </Button>
        </form>
      </Form>
    </div>
  );
}

