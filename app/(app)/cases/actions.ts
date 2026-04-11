"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  matterStatusOptions,
  matterTypeOptions,
  matterCaseTypeOptions,
  matterPartyTypeOptions,
} from "@/lib/constants/cases";
import { COURT_NAME_OTHER_VALUE } from "@/lib/constants/geo";
import { resolveCourtNameForDb } from "@/lib/court-name";

const matterSchema = z
  .object({
    clientId: z.string().uuid({ message: "Select a client" }),
    matterType: z.enum(matterTypeOptions.map((option) => option.value) as [string, ...string[]]),
    matterStatus: z.enum(matterStatusOptions.map((option) => option.value) as [string, ...string[]]),
    caseNumber: z.string().optional(),
    caseFileDate: z.string().optional(),
    caseType: z.enum(matterCaseTypeOptions.map((option) => option.value) as [string, ...string[]]).optional(),
    caseTypeOther: z.string().optional(),
    courtName: z.string().min(1, "Court is required"),
    courtNameOther: z.string().optional(),
    district: z.string().min(2),
    clientBrief: z.string().optional(),
    againstParties: z.string().optional(),
    againstPartiesType: z.enum(
      matterPartyTypeOptions.map((option) => option.value) as [string, ...string[]],
    ),
    evidenceProvided: z.string().optional(),
    documentsProvided: z.string().optional(),
    pendingDocuments: z.string().optional(),
    assignedAttorneys: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.matterType === "litigation" && !data.caseType) {
      ctx.addIssue({
        path: ["caseType"],
        code: z.ZodIssueCode.custom,
        message: "Select a case type for litigation matters.",
      });
    }
    if (data.matterType === "litigation" && data.caseType === "other") {
      if (!data.caseTypeOther || String(data.caseTypeOther).trim().length === 0) {
        ctx.addIssue({
          path: ["caseTypeOther"],
          code: z.ZodIssueCode.custom,
          message: "Please specify the case type when selecting Other.",
        });
      }
    }
    if (data.matterType === "litigation" && !data.caseFileDate) {
      ctx.addIssue({
        path: ["caseFileDate"],
        code: z.ZodIssueCode.custom,
        message: "Provide the filing date for litigation matters.",
      });
    }
    const resolvedCourt = resolveCourtNameForDb(data.courtName, data.courtNameOther);
    if (resolvedCourt.length < 2) {
      ctx.addIssue({
        path: [data.courtName === COURT_NAME_OTHER_VALUE ? "courtNameOther" : "courtName"],
        code: z.ZodIssueCode.custom,
        message:
          data.courtName === COURT_NAME_OTHER_VALUE
            ? "Enter the full court name (at least 2 characters)."
            : "Court is required.",
      });
    }
  });

export type MatterFormValues = z.infer<typeof matterSchema>;

type ActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function normaliseList(input?: string | null) {
  if (!input) return [] as string[];
  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createMatter(values: MatterFormValues): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = matterSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload = parsed.data;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.firm_id) {
    return { message: "You must belong to a firm before creating matters." };
  }

  const assignedAttorneys = payload.assignedAttorneys ?? [];
  const filingDate = payload.caseFileDate && payload.caseFileDate.length > 0 ? payload.caseFileDate : null;
  const evidenceList = normaliseList(payload.evidenceProvided);
  const documentsList = normaliseList(payload.documentsProvided);
  const pendingList = normaliseList(payload.pendingDocuments);
  const courtResolved = resolveCourtNameForDb(payload.courtName, payload.courtNameOther);

  const { data: matterInsert, error: insertError } = await supabase
    .from("matters")
    // Cast to any to avoid strict type drift between DB and generated types
    .insert({
      firm_id: profile.firm_id,
      client_id: payload.clientId,
      matter_type: payload.matterType,
      matter_status: payload.matterStatus,
      case_number: payload.caseNumber ?? null,
      court_name: courtResolved,
      district: payload.district,
      case_file_date: filingDate,
      case_type: payload.caseType ?? null,
      case_type_other: payload.caseType === "other" && payload.caseTypeOther ? payload.caseTypeOther.trim() : null,
      client_brief: payload.clientBrief ?? null,
      against_parties: payload.againstParties
        ? {
            type: payload.againstPartiesType,
            details: payload.againstParties,
          }
        : null,
      evidence_provided: evidenceList,
      documents_provided: documentsList,
      pending_documents: pendingList,
      assigned_attorneys: assignedAttorneys,
      created_by: user.id,
      updated_by: user.id,
    } as any)
    .select("id, serial_number, case_file_date")
    .maybeSingle();

  if (insertError || !matterInsert) {
    if (insertError?.code === "23505") {
      return { message: "A matter with this serial or case number already exists." };
    }
    return { message: `Could not create matter: ${insertError?.message ?? "Unknown error"}` };
  }

  const matterId = matterInsert.id;

  const documentPaths = normaliseList(payload.documentsProvided);
  if (documentPaths.length > 0) {
    const documentRows = documentPaths.map((path) => ({
      firm_id: profile.firm_id,
      matter_id: matterId,
      storage_path: path,
      file_name: path.split("/").pop() ?? path,
      uploaded_by: user.id,
    }));
    await supabase.from("documents").insert(documentRows as any);
  }

  // Seed initial finance record if one does not exist
  await supabase.from("finances").insert({
    firm_id: profile.firm_id,
    matter_id: matterId,
    fee_total: 0,
    fee_paid: 0,
  } as any);

  // Log history entry
  await supabase.from("case_histories").insert({
    firm_id: profile.firm_id,
    matter_id: matterId,
    date: new Date().toISOString().slice(0, 10),
    details: "Matter created",
    stage: "Intake",
    court_name: courtResolved,
    case_number: payload.caseNumber ?? null,
    updated_by: user.id,
  } as any);

  // Create calendar event for filing if a date is provided
  if (matterInsert.case_file_date) {
    await supabase.from("calendar_events").insert({
      firm_id: profile.firm_id,
      matter_id: matterId,
      event_type: "hearing",
      event_date: matterInsert.case_file_date,
      description: "Initial filing / diary reminder",
      notified_users: assignedAttorneys.length > 0 ? assignedAttorneys : [user.id],
      created_by: user.id,
    } as any);
  }

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");

  return { success: true };
}

