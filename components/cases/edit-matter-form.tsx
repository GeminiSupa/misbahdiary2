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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { updateMatter, type UpdateMatterFormValues } from "@/app/(app)/cases/[id]/actions";
import {
  matterStatusOptions,
  matterTypeOptions,
  matterCaseTypeOptions,
  matterPartyTypeOptions,
} from "@/lib/constants/cases";
import { COURT_NAME_OTHER_VALUE, pakistanCourtOptions, pakistanDistrictOptions } from "@/lib/constants/geo";
import { Loader2, User, Users, Briefcase, Calendar, FileText, CheckCircle2, X, MapPin, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

const formSchema = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid({ message: "Select a client" }),
    matterType: z
      .enum(matterTypeOptions.map((option) => option.value) as [string, ...string[]]),
    matterStatus: z
      .enum(matterStatusOptions.map((option) => option.value) as [string, ...string[]]),
    caseNumber: z.string().optional().or(z.literal("")),
    caseFileDate: z.string().optional().or(z.literal("")),
    caseType: z
      .enum(matterCaseTypeOptions.map((option) => option.value) as [string, ...string[]])
      .optional()
      .or(z.literal("")),
    caseTypeOther: z.string().optional().or(z.literal("")),
    courtName: z.string().min(1, "Court is required"),
    courtNameOther: z.string().optional().or(z.literal("")),
    district: z.string().min(2, "District is required"),
    clientBrief: z.string().optional().or(z.literal("")),
    againstParties: z.string().optional().or(z.literal("")),
    againstPartiesType: z
      .enum(matterPartyTypeOptions.map((option) => option.value) as [string, ...string[]]),
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
      if (data.caseType === "other") {
        if (!data.caseTypeOther || data.caseTypeOther.trim().length === 0) {
          ctx.addIssue({
            path: ["caseTypeOther"],
            code: z.ZodIssueCode.custom,
            message: "Please specify the case type when selecting Other.",
          });
        }
      }
      if (!data.caseFileDate) {
        ctx.addIssue({
          path: ["caseFileDate"],
          code: z.ZodIssueCode.custom,
          message: "Provide the court filing date.",
        });
      }
    }
    if (data.courtName === COURT_NAME_OTHER_VALUE) {
      if (!data.courtNameOther || data.courtNameOther.trim().length < 2) {
        ctx.addIssue({
          path: ["courtNameOther"],
          code: z.ZodIssueCode.custom,
          message: "Enter the full court name when selecting Other.",
        });
      }
    }
  });

type EditMatterFormProps = {
  matter: UpdateMatterFormValues;
  clients: Array<{ id: string; label: string }>;
  staff: Array<{ id: string; label: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function EditMatterForm({ matter, clients, staff, onSuccess, onCancel }: EditMatterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Ensure all required fields have proper defaults
  const defaultValues: UpdateMatterFormValues = {
    id: matter.id,
    clientId: matter.clientId || (matter as any).client_id || "",
    matterType: (matter.matterType || (matter as any).matter_type || "litigation") as "litigation" | "advisory" | "mediation",
    matterStatus: (matter.matterStatus || (matter as any).matter_status || "fresh diary") as any,
    caseNumber: matter.caseNumber ?? "",
    caseFileDate: matter.caseFileDate ?? "",
    caseType: matter.caseType ?? "",
    caseTypeOther: (matter as any).caseTypeOther ?? "",
    courtName: matter.courtName?.length ? matter.courtName : "",
    courtNameOther: matter.courtNameOther ?? "",
    district: (matter.district && matter.district.length >= 2) ? matter.district : "",
    clientBrief: matter.clientBrief ?? "",
    againstParties: matter.againstParties ?? "",
    againstPartiesType: (matter.againstPartiesType || "individual") as "individual" | "organization",
    evidenceProvided: matter.evidenceProvided ?? "",
    documentsProvided: matter.documentsProvided ?? "",
    pendingDocuments: matter.pendingDocuments ?? "",
    assignedAttorneys: matter.assignedAttorneys ?? [],
  };

  const form = useForm<UpdateMatterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const matterType = useWatch({ control: form.control, name: "matterType" });
  const caseType = useWatch({ control: form.control, name: "caseType" });
  const selectedCourtName = useWatch({ control: form.control, name: "courtName" });
  const isLitigation = matterType === "litigation";

  const onSubmit = async (values: UpdateMatterFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await updateMatter({
      ...values,
      courtNameOther: values.courtNameOther?.trim() || undefined,
    });

    if (result.success) {
      router.refresh();
      onSuccess?.();
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as keyof UpdateMatterFormValues, {
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
    <div className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to update matter</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Briefcase className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            </div>

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Client
                  </FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className={cn(
                        "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      <option value="">Select client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="matterType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matter Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        {matterTypeOptions.map((option) => (
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
                name="matterStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
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
            </div>
          </div>

          <Separator />

          {/* Court Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Scale className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Court Information</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="courtName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5" />
                      Court Name
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <option value="">Select court</option>
                        {pakistanCourtOptions.map((court) => (
                          <option key={court} value={court}>
                            {court}
                          </option>
                        ))}
                        <option value={COURT_NAME_OTHER_VALUE}>Other (type court name)</option>
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
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      District
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <option value="">Select district</option>
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
            </div>

            {selectedCourtName === COURT_NAME_OTHER_VALUE ? (
              <FormField
                control={form.control}
                name="courtNameOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom court name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full name of court or bench" className="h-10" />
                    </FormControl>
                    <FormDescription className="text-xs">Use when your court is not listed above.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {isLitigation && (
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="caseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="23/25" className="h-10" />
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
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Filing Date
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className={cn(
                            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-50",
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

                {caseType === "other" && (
                  <FormField
                    control={form.control}
                    name="caseTypeOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specify case type</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter the case type (e.g. Family, Labour, etc.)"
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Client Brief */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Client Brief</h3>
            </div>

            <FormField
              control={form.control}
              name="clientBrief"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brief Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Describe the matter, client's situation, and key facts..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Provide a clear overview of the matter and client's requirements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Team Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Team Assignment</h3>
            </div>

            <FormField
              control={form.control}
              name="assignedAttorneys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Attorneys</FormLabel>
                  <FormControl>
                    <div className="grid gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                      {staff.map((member) => {
                        const checked = field.value?.includes(member.id) ?? false;
                        return (
                          <label
                            key={member.id}
                            className={cn(
                              "flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-all",
                              "hover:scale-[1.01] active:scale-[0.99]",
                              checked
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border bg-background hover:border-primary/50",
                            )}
                          >
                            <span className="flex-1">{member.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                const selected = field.value ?? [];
                                if (event.target.checked) {
                                  field.onChange([...selected, member.id]);
                                } else {
                                  field.onChange(selected.filter((id) => id !== member.id));
                                }
                              }}
                              className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Select team members to assign to this matter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Cancel</span>
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span className="whitespace-nowrap">Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Update Matter</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

