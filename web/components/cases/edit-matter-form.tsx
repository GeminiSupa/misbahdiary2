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
import { pakistanCourtOptions, pakistanDistrictOptions } from "@/lib/constants/geo";
import { Loader2, User, Users, Briefcase, Calendar, FileText, CheckCircle2, X, MapPin, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

const formSchema = z
  .object({
    id: z.string().uuid(),
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

  const form = useForm<UpdateMatterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: matter.id,
      clientId: matter.clientId,
      matterType: matter.matterType,
      matterStatus: matter.matterStatus,
      caseNumber: matter.caseNumber ?? "",
      caseFileDate: matter.caseFileDate ?? "",
      caseType: matter.caseType ?? "",
      courtName: matter.courtName,
      district: matter.district,
      clientBrief: matter.clientBrief ?? "",
      againstParties: matter.againstParties ?? "",
      againstPartiesType: matter.againstPartiesType ?? "individual",
      evidenceProvided: matter.evidenceProvided ?? "",
      documentsProvided: matter.documentsProvided ?? "",
      pendingDocuments: matter.pendingDocuments ?? "",
      assignedAttorneys: matter.assignedAttorneys ?? [],
    },
  });

  const matterType = useWatch({ control: form.control, name: "matterType" });
  const isLitigation = matterType === "litigation";

  const onSubmit = async (values: UpdateMatterFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await updateMatter(values);

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
          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Matter
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

