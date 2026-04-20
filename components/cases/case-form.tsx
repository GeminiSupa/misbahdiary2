// @ts-nocheck

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
import { createMatter, type MatterFormValues } from "@/app/(app)/cases/actions";
import {
  matterStatusOptions,
  matterTypeOptions,
  matterCaseTypeOptions,
  matterPartyTypeOptions,
} from "@/lib/constants/cases";
import { COURT_NAME_OTHER_VALUE, pakistanCourtOptions, pakistanDistrictOptions } from "@/lib/constants/geo";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Users, Briefcase, Calendar, FileText, CheckCircle2, XCircle } from "lucide-react";
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
    caseTypeOther: z.string().optional().or(z.literal("")),
    courtName: z.string().min(1, "Court is required"),
    courtNameOther: z.string().optional().or(z.literal("")),
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

type Props = {
  clients: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
};

export function CaseForm({ clients, staff, onSuccess }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const form = useForm<MatterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      matterType: "litigation",
      matterStatus: "fresh diary",
      caseNumber: "",
      caseFileDate: "",
      caseType: "",
      caseTypeOther: "",
      courtName: pakistanCourtOptions[0] ?? "",
      courtNameOther: "",
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
  const selectedCaseType = useWatch({ control: form.control, name: "caseType" });
  const selectedCourtName = useWatch({ control: form.control, name: "courtName" });
  const selectedAttorneys = useWatch({ control: form.control, name: "assignedAttorneys" }) || [];

  const applyAiSuggestions = (s: Record<string, unknown>) => {
    if (typeof s.clientBrief === "string" && s.clientBrief.trim()) {
      form.setValue("clientBrief", s.clientBrief.trim());
    }
    if (typeof s.againstParties === "string" && s.againstParties.trim()) {
      form.setValue("againstParties", s.againstParties.trim());
    }
    if (typeof s.caseNumber === "string" && s.caseNumber.trim()) {
      form.setValue("caseNumber", s.caseNumber.trim());
    }
    const courtHint = typeof s.suggestedCourtName === "string" ? s.suggestedCourtName.trim() : "";
    if (courtHint) {
      const match = pakistanCourtOptions.find((c) => c.toLowerCase() === courtHint.toLowerCase());
      if (match) {
        form.setValue("courtName", match);
        form.setValue("courtNameOther", "");
      } else {
        form.setValue("courtName", COURT_NAME_OTHER_VALUE);
        form.setValue("courtNameOther", courtHint);
      }
    }
    const dist = typeof s.suggestedDistrict === "string" ? s.suggestedDistrict.trim() : "";
    if (dist) {
      const dMatch = pakistanDistrictOptions.find((d) => d.toLowerCase() === dist.toLowerCase());
      if (dMatch) {
        form.setValue("district", dMatch);
      }
    }
  };

  const handleAiSuggest = async () => {
    setAiMessage(null);
    const text = aiNotes.trim();
    if (text.length < 12) {
      setAiMessage("Add a short description (at least a sentence or two) for better suggestions.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/matter-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: text }),
      });
      const data = (await res.json()) as {
        configured?: boolean;
        message?: string;
        suggestions?: Record<string, unknown>;
      };
      if (!res.ok) {
        setAiMessage(data.message ?? "Could not get suggestions.");
        return;
      }
      if (data.configured === false) {
        setAiMessage(data.message ?? "Configure OPENAI_API_KEY to enable AI suggestions.");
        return;
      }
      if (data.suggestions && typeof data.suggestions === "object") {
        applyAiSuggestions(data.suggestions);
        setAiMessage("Fields below were filled from your notes. Review before saving.");
      } else {
        setAiMessage(data.message ?? "No suggestions returned.");
      }
    } catch {
      setAiMessage("Request failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAttorney = (attorneyId: string) => {
    const current = form.getValues("assignedAttorneys") || [];
    const updated = current.includes(attorneyId)
      ? current.filter((id) => id !== attorneyId)
      : [...current, attorneyId];
    form.setValue("assignedAttorneys", updated);
  };

  const onSubmit = async (values: MatterFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await createMatter({
      ...values,
      caseNumber: values.caseNumber || undefined,
      caseFileDate: values.caseFileDate || undefined,
      caseType: values.caseType || undefined,
      caseTypeOther: values.caseType === "other" ? values.caseTypeOther?.trim() || undefined : undefined,
      courtNameOther: values.courtNameOther?.trim() || undefined,
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
      onSuccess?.();
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
    <div className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Could not create matter</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">AI draft assist</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe the matter in your own words (parties, court, relief sought). AI can suggest text for several
              fields—you should always review before saving.
            </p>
            <Textarea
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              placeholder="e.g. Civil suit for possession in Karachi; plaintiff is our client; case filed in Sindh High Court..."
              rows={3}
              className="resize-none text-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={aiLoading} onClick={() => void handleAiSuggest()}>
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Suggest fields
                  </>
                )}
              </Button>
              {aiMessage ? <span className="text-xs text-muted-foreground">{aiMessage}</span> : null}
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Basic information</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                          "flex min-h-[44px] h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base ring-offset-background sm:h-10 sm:text-sm sm:min-h-[40px]",
                          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                          "placeholder:text-muted-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <option value="">Select a client</option>
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
                name="matterType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5" />
                      Matter Type
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {matterTypeOptions.map((option) => (
                          <button
                            type="button"
                            key={option.value}
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "flex-1 min-w-[100px] min-h-[44px] rounded-lg border-2 px-3 py-2.5 text-base font-medium transition-all sm:min-h-[40px] sm:text-sm",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              field.value === option.value
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-border bg-background hover:border-primary/50 hover:bg-accent",
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
            </div>

            <FormField
              control={form.control}
              name="assignedAttorneys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Assigned Attorneys
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {staff.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No staff members available</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-muted/30 sm:grid-cols-2 sm:max-h-32">
                          {staff.map((member) => {
                            const isSelected = selectedAttorneys.includes(member.id);
                            return (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => toggleAttorney(member.id)}
                                className={cn(
                                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 min-h-[44px] text-base transition-all sm:min-h-[40px] sm:text-sm",
                                  "active:scale-[0.98]",
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                    : "border-border bg-background hover:border-primary/50 hover:bg-muted/30",
                                )}
                              >
                                <span>{member.name}</span>
                                {isSelected ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Click to select attorneys. Selected attorneys will be highlighted.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Court & Case Details Section */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Court & case details</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="courtName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Court Name</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex min-h-[44px] h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base ring-offset-background sm:h-10 sm:text-sm sm:min-h-[40px]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
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
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex min-h-[44px] h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base ring-offset-background sm:h-10 sm:text-sm sm:min-h-[40px]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
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
            </div>

            {selectedCourtName === COURT_NAME_OTHER_VALUE ? (
              <FormField
                control={form.control}
                name="courtNameOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom court name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full name of court or bench" className="min-h-[44px] sm:min-h-[40px]" />
                    </FormControl>
                    <FormDescription className="text-xs">Use when your court is not listed above.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
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
                          "flex min-h-[44px] h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base ring-offset-background sm:h-10 sm:text-sm sm:min-h-[40px]",
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

              <FormField
                control={form.control}
                name="caseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Optional until court allocates"
                        className="h-10"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Leave blank if not yet assigned</FormDescription>
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
                      Case File Date
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedMatterType === "litigation" && (
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
                          "flex min-h-[44px] h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base ring-offset-background sm:h-10 sm:text-sm sm:min-h-[40px]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <option value="">Select case type</option>
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
            )}

            {selectedMatterType === "litigation" && selectedCaseType === "other" && (
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

          <Separator />

          {/* Case Details Section */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Case details</h3>
            </div>

            <FormField
              control={form.control}
              name="clientBrief"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Brief</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Summarize the facts, relief sought, and mandates provided by the client..."
                      className="resize-none"
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
                    <FormLabel>Opposing Parties</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="List parties involved against your client..."
                        className="resize-none"
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
                    <FormLabel>Party Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex min-h-[44px] h-11 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base ring-offset-background sm:h-10 sm:text-sm sm:min-h-[40px]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
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
          </div>

          <Separator />

          {/* Documents Section */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 py-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">Documents & evidence</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="evidenceProvided"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence Provided</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="List evidence items (one per line)..."
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Separate each item on a new line</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentsProvided"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documents Uploaded</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="List key documents in storage..."
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Documents linked in Supabase storage</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pendingDocuments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    Pending Documentation
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="List items outstanding from the client..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Items still needed from the client</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <span>Reset</span>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Save Matter</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
