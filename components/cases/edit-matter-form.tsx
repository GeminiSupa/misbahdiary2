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
import { saveAiDraftToTimeline, updateMatter, type UpdateMatterFormValues } from "@/app/(app)/cases/[id]/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  matterStatusOptions,
  matterTypeOptions,
  matterCaseTypeOptions,
  matterPartyTypeOptions,
} from "@/lib/constants/cases";
import { COURT_NAME_OTHER_VALUE, pakistanCourtOptions, pakistanDistrictOptions } from "@/lib/constants/geo";
import { Loader2, User, Users, Briefcase, Calendar, FileText, CheckCircle2, X, MapPin, Scale, Sparkles, Copy } from "lucide-react";
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
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiTemplateType, setAiTemplateType] = useState<
    "generic" | "civil_plaint" | "writ_petition" | "bail_application" | "criminal_complaint" | "appeal_memo"
  >("generic");
  const [aiDraft, setAiDraft] = useState<{
    draft?: string;
    checklist?: string[];
    questionsForClient?: string[];
    riskNotes?: string[];
    grounds?: string[];
    prayer?: string;
  } | null>(null);

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

  const applyAiSuggestions = (suggestions: Record<string, unknown>) => {
    const s = suggestions as Record<string, unknown>;
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

  const handleAiDraft = async () => {
    setAiMessage(null);
    setAiDraft(null);
    const text = aiNotes.trim();
    if (text.length < 12) {
      setAiMessage("Add a short description (at least a sentence or two) for better drafting.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/legal-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: text,
          templateType: aiTemplateType,
          matterContext: {
            clientName: clients.find((c) => c.id === form.getValues("clientId"))?.label || undefined,
            courtName:
              form.getValues("courtName") === COURT_NAME_OTHER_VALUE
                ? form.getValues("courtNameOther") || undefined
                : form.getValues("courtName") || undefined,
            district: form.getValues("district") || undefined,
            caseNumber: form.getValues("caseNumber") || undefined,
            matterType: form.getValues("matterType") || undefined,
          },
        }),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        setAiMessage(data.message ?? "Could not generate draft.");
        return;
      }
      if (data.configured === false) {
        setAiMessage(data.message ?? "Configure GROQ_API_KEY to enable AI drafting.");
        return;
      }

      if (data.suggestions && typeof data.suggestions === "object") {
        applyAiSuggestions(data.suggestions);
      }

      setAiDraft({
        draft: typeof data.draft === "string" ? data.draft : undefined,
        checklist: Array.isArray(data.checklist) ? data.checklist : undefined,
        questionsForClient: Array.isArray(data.questionsForClient) ? data.questionsForClient : undefined,
        riskNotes: Array.isArray(data.riskNotes) ? data.riskNotes : undefined,
        grounds: Array.isArray(data.grounds) ? data.grounds : undefined,
        prayer: typeof data.prayer === "string" ? data.prayer : undefined,
      });

      setAiMessage("Draft generated. Review and copy before using in court.");
    } catch {
      setAiMessage("Request failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const copyDraft = async () => {
    const text = aiDraft?.draft?.trim();
    if (!text) {
      setAiMessage("No draft to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setAiMessage("Draft copied to clipboard.");
    } catch {
      setAiMessage("Clipboard not available. Select text and copy manually.");
    }
  };

  const saveDraft = async () => {
    const text = aiDraft?.draft?.trim();
    if (!text) {
      setAiMessage("No draft to save yet.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await saveAiDraftToTimeline({
        matterId: matter.id,
        templateType: aiTemplateType,
        draft: text,
      });
      if (res.success) {
        setAiMessage("Draft saved to timeline.");
        router.refresh();
      } else {
        setAiMessage(res.message ?? "Could not save draft.");
      }
    } finally {
      setAiLoading(false);
    }
  };

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
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-medium text-foreground">AI drafting assistant</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Draft a pleading template and get field suggestions from your notes. Always review before filing.
            </p>
            <Textarea
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              placeholder="Add facts, parties, dates, forum, relief sought…"
              rows={3}
              className="resize-none text-sm"
              disabled={aiLoading}
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <select
                value={aiTemplateType}
                onChange={(e) => setAiTemplateType(e.target.value as any)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                disabled={aiLoading}
              >
                <option value="generic">Generic (case note + prayer)</option>
                <option value="civil_plaint">Civil plaint</option>
                <option value="writ_petition">Writ petition (HC)</option>
                <option value="bail_application">Bail application</option>
                <option value="criminal_complaint">Criminal complaint</option>
                <option value="appeal_memo">Appeal memo / revision</option>
              </select>

              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={aiLoading}
                onClick={() => void handleAiDraft()}
                className="w-full sm:w-auto"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    Drafting…
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4 shrink-0" />
                    Generate draft
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={aiLoading || !aiDraft?.draft}
                onClick={() => void saveDraft()}
                className="w-full sm:w-auto"
              >
                Save to timeline
              </Button>
            </div>

            {aiMessage ? <p className="text-xs text-muted-foreground">{aiMessage}</p> : null}

            {aiDraft?.draft ? (
              <div className="rounded-lg border border-border bg-background/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-foreground">Draft output</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void copyDraft()}>
                    <Copy className="mr-2 h-4 w-4 shrink-0" />
                    Copy draft
                  </Button>
                </div>
                <Tabs defaultValue="draft" className="mt-2">
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                    <TabsTrigger value="checklist">Checklist</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                    <TabsTrigger value="risks">Risks</TabsTrigger>
                  </TabsList>
                  <TabsContent value="draft" className="mt-2">
                    <Textarea value={aiDraft.draft} readOnly rows={10} className="resize-none text-sm" />
                  </TabsContent>
                  <TabsContent value="checklist" className="mt-2">
                    <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {(aiDraft.checklist ?? []).map((x, idx) => (
                        <li key={idx}>{x}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="questions" className="mt-2">
                    <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {(aiDraft.questionsForClient ?? []).map((x, idx) => (
                        <li key={idx}>{x}</li>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="risks" className="mt-2">
                    <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {(aiDraft.riskNotes ?? []).map((x, idx) => (
                        <li key={idx}>{x}</li>
                      ))}
                    </ul>
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </div>

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

