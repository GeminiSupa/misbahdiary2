"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logMatterDeleted } from "@/lib/audit/logger";
import {
  matterStatusOptions,
  matterTypeOptions,
  matterCaseTypeOptions,
  matterPartyTypeOptions,
} from "@/lib/constants/cases";

const DOCUMENT_BUCKET = "case_files";

export type ActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const updateMatterSchema = z
  .object({
    id: z.string().uuid(),
    clientId: z.string().uuid({ message: "Select a client" }),
    matterType: z.enum(matterTypeOptions.map((option) => option.value) as [string, ...string[]]),
    matterStatus: z.enum(matterStatusOptions.map((option) => option.value) as [string, ...string[]]),
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
    assignedAttorneys: z.array(z.string().uuid()).optional(),
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

export type UpdateMatterFormValues = z.infer<typeof updateMatterSchema>;

function normaliseList(input?: string | null) {
  if (!input) return [] as string[];
  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateMatter(values: UpdateMatterFormValues): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "You must be signed in to update matters." };
  }

  const parsed = updateMatterSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "You must belong to a firm before updating matters." };
  }

  // Verify the matter belongs to the user's firm and get existing assignments
  const { data: existingMatter } = await supabase
    .from("matters")
    .select("id, firm_id, serial_number, assigned_attorneys")
    .eq("id", payload.id)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!existingMatter) {
    return { success: false, message: "Matter not found or access denied." };
  }

  const assignedAttorneys = payload.assignedAttorneys ?? [];
  const filingDate = payload.caseFileDate && payload.caseFileDate.length > 0 ? payload.caseFileDate : null;
  const evidenceList = normaliseList(payload.evidenceProvided);
  const documentsList = normaliseList(payload.documentsProvided);
  const pendingList = normaliseList(payload.pendingDocuments);

  // Get old assignments for comparison
  const oldAssignments = Array.isArray(existingMatter.assigned_attorneys)
    ? (existingMatter.assigned_attorneys as string[])
    : [];
  const oldAssignmentSet = new Set(oldAssignments);
  const newAssignmentSet = new Set(assignedAttorneys);

  // Find newly assigned users (in new but not in old)
  const newlyAssigned = assignedAttorneys.filter((id) => !oldAssignmentSet.has(id));
  // Find unassigned users (in old but not in new)
  const unassigned = oldAssignments.filter((id) => !newAssignmentSet.has(id));

  const { error: updateError } = await supabase
    .from("matters")
    .update({
      client_id: payload.clientId,
      matter_type: payload.matterType,
      matter_status: payload.matterStatus,
      case_number: payload.caseNumber ?? null,
      court_name: payload.courtName,
      district: payload.district,
      case_file_date: filingDate,
      case_type: payload.caseType ?? null,
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
      updated_by: user.id,
    } as any)
    .eq("id", payload.id);

  if (updateError) {
    console.error("Error updating matter:", updateError);
    return {
      success: false,
      message: `Unable to update matter: ${updateError.message}`,
    };
  }

  // Update matter_assignments table
  // Note: matter_assignments table not in TypeScript types yet, using type assertion
  // Mark unassigned users as inactive
  if (unassigned.length > 0) {
    await (supabase as any)
      .from("matter_assignments")
      .update({ is_active: false })
      .eq("matter_id", payload.id)
      .in("user_id", unassigned);
  }

  // Add new assignments or reactivate existing ones
  if (newlyAssigned.length > 0) {
    const newAssignments = newlyAssigned.map((userId) => ({
      matter_id: payload.id,
      user_id: userId,
      assigned_by: user.id,
      is_active: true,
      assigned_at: new Date().toISOString(),
    }));

    await (supabase as any)
      .from("matter_assignments")
      .upsert(newAssignments, {
        onConflict: "matter_id,user_id", // This is the correct syntax for composite unique constraint
        ignoreDuplicates: false,
      });
  }

  // Send notifications for newly assigned users
  if (newlyAssigned.length > 0) {
    const { createNotificationsForRecipients } = await import("@/lib/server/notifications");
    const matterSerial = existingMatter.serial_number ?? "matter";

    await createNotificationsForRecipients(
      {
        firmId: profile.firm_id,
        title: "Assigned to matter",
        message: `You have been assigned to matter ${matterSerial}.`,
        type: "case",
        link: `/cases/${payload.id}`,
        relatedEntity: "matter",
        relatedId: payload.id,
      },
      newlyAssigned,
    ).catch((error) => {
      console.error("Failed to send assignment notifications:", error);
      // Don't fail the operation if notifications fail
    });
  }

  revalidatePath(`/cases/${payload.id}`);
  revalidatePath("/cases");

  return { success: true };
}

export async function uploadMatterDocument(formData: FormData) {
  const matterId = formData.get("matterId");
  const hearingId = formData.get("hearingId");
  const file = formData.get("file");

  if (typeof matterId !== "string" || matterId.length === 0) {
    return { success: false, message: "Matter reference missing." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Select a file to upload." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, message: "You must be signed in to upload documents." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "Join or create a firm before uploading documents." };
  }

  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const baseFolder = hearingId ? `${matterId}/hearings/${hearingId}` : matterId;
  const path = `${profile.firm_id}/${baseFolder}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) {
    return { success: false, message: `Unable to upload file: ${uploadError.message}` };
  }

  const isHearingDocument = typeof hearingId === "string" && hearingId.length > 0;

  const { error: insertError } = await supabase.from("documents").insert({
    firm_id: profile.firm_id,
    matter_id: matterId,
    storage_path: path,
    file_name: file.name,
    uploaded_by: user.id,
    metadata: isHearingDocument
      ? {
          kind: "hearing_order",
          hearingId,
        }
      : {
          kind: "matter_document",
        },
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
    return { success: false, message: `Unable to save document metadata: ${insertError.message}` };
  }

  revalidatePath(`/cases/${matterId}`);
  revalidatePath("/cases");

  return { success: true };
}

export async function deleteMatter(matterId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "You must be signed in to delete matters." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "Join or create a firm before managing matters." };
  }

  // Check permissions - only Firm Owners and Principal Partners can delete matters
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canDelete = isOwner || profile.role === "principal_partner";

  if (!canDelete) {
    return { success: false, message: "Only Firm Owners and Principal Partners can delete matters." };
  }

  // Check if matter exists and belongs to the firm
  const { data: matter } = await supabase
    .from("matters")
    .select("id, firm_id, serial_number")
    .eq("id", matterId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!matter) {
    return { success: false, message: "Matter not found or you do not have access." };
  }

  // Check for associated invoices
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, invoice_number")
    .eq("matter_id", matterId)
    .limit(1);

  if (invoicesError) {
    return { success: false, message: `Error checking associated invoices: ${invoicesError.message}` };
  }

  if (invoices && invoices.length > 0) {
    return {
      success: false,
      message: `Cannot delete matter. This matter has ${invoices.length} associated invoice(s). Please remove or reassign the invoices first.`,
    };
  }

  // Check for associated hearings
  const { data: hearings, error: hearingsError } = await supabase
    .from("hearings")
    .select("id")
    .eq("matter_id", matterId)
    .limit(1);

  if (hearingsError) {
    return { success: false, message: `Error checking associated hearings: ${hearingsError.message}` };
  }

  // Delete associated documents from storage
  const { data: documents } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("firm_id", profile.firm_id)
    .eq("matter_id", matterId);

  if (documents && documents.length > 0) {
    const paths = documents.map((doc) => doc.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove(paths);
    }
  }

  // Delete matter (cascade will handle hearings and documents)
  const { error: deleteError } = await supabase
    .from("matters")
    .delete()
    .eq("id", matterId)
    .eq("firm_id", profile.firm_id);

  if (deleteError) {
    return { success: false, message: `Could not delete matter: ${deleteError.message}` };
  }

  revalidatePath("/cases");
  revalidatePath(`/cases/${matterId}`);

  return { success: true };
}

export async function getSignedMatterDocumentUrl(documentId: string) {
  if (!documentId) {
    return { success: false, message: "Document reference missing." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, message: "Sign in required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "Join or create a firm to access documents." };
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, storage_path, firm_id, matter_id")
    .eq("id", documentId)
    .maybeSingle();

  if (!document || document.firm_id !== profile.firm_id) {
    return { success: false, message: "Document not found." };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(document.storage_path, 60);

  if (signedError || !signed) {
    return { success: false, message: signedError?.message ?? "Unable to generate signed URL." };
  }

  return { success: true, url: signed.signedUrl };
}

export async function recordPayment(formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "You must be signed in to record payments." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "Join or create a firm before recording payments." };
  }

  const matterId = formData.get("matterId");
  const amountStr = formData.get("amount");
  const date = formData.get("date");
  const method = formData.get("method");
  const notes = formData.get("notes");

  if (typeof matterId !== "string" || matterId.length === 0) {
    return { success: false, message: "Matter reference missing." };
  }

  if (!amountStr || typeof amountStr !== "string") {
    return { success: false, message: "Amount is required." };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: "Amount must be a positive number." };
  }

  if (typeof date !== "string" || date.length === 0) {
    return { success: false, message: "Date is required." };
  }

  // Verify the matter belongs to the user's firm
  const { data: matter } = await supabase
    .from("matters")
    .select("id, firm_id")
    .eq("id", matterId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!matter) {
    return { success: false, message: "Matter not found or access denied." };
  }

  // Get or create finance record
  const { data: existingFinance } = await supabase
    .from("finances")
    .select("id, fee_total, fee_paid, payment_history")
    .eq("matter_id", matterId)
    .maybeSingle();

  const currentTotal = Number(existingFinance?.fee_total ?? 0);
  const currentPaid = Number(existingFinance?.fee_paid ?? 0);
  const newPaid = currentPaid + amount;

  // Get existing payment history
  const existingHistory = Array.isArray(existingFinance?.payment_history)
    ? existingFinance.payment_history
    : [];

  // Add new payment to history
  const newPaymentEntry = {
    date: date,
    amount: amount,
    method: typeof method === "string" && method.length > 0 ? method : null,
    notes: typeof notes === "string" && notes.length > 0 ? notes : null,
    recorded_at: new Date().toISOString(),
    recorded_by: user.id,
  };

  const updatedHistory = [...existingHistory, newPaymentEntry];

  if (existingFinance) {
    // Update existing finance record
    const { error: updateError } = await supabase
      .from("finances")
      .update({
        fee_paid: newPaid,
        payment_history: updatedHistory,
      })
      .eq("id", existingFinance.id);

    if (updateError) {
      console.error("Error updating finance:", updateError);
      return { success: false, message: `Unable to record payment: ${updateError.message}` };
    }
  } else {
    // Create new finance record
    const { error: insertError } = await supabase.from("finances").insert({
      firm_id: profile.firm_id,
      matter_id: matterId,
      fee_total: currentTotal,
      fee_paid: newPaid,
      payment_history: updatedHistory,
    });

    if (insertError) {
      console.error("Error creating finance:", insertError);
      return { success: false, message: `Unable to record payment: ${insertError.message}` };
    }
  }

  revalidatePath(`/cases/${matterId}`);
  revalidatePath("/cases");

  return { success: true };
}

export async function updateFeeTotal(formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "You must be signed in to update fee totals." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "Join or create a firm before updating fee totals." };
  }

  const matterId = formData.get("matterId");
  const feeTotalStr = formData.get("feeTotal");

  if (typeof matterId !== "string" || matterId.length === 0) {
    return { success: false, message: "Matter reference missing." };
  }

  if (!feeTotalStr || typeof feeTotalStr !== "string") {
    return { success: false, message: "Fee total is required." };
  }

  const feeTotal = parseFloat(feeTotalStr);
  if (isNaN(feeTotal) || feeTotal < 0) {
    return { success: false, message: "Fee total must be a non-negative number." };
  }

  // Verify the matter belongs to the user's firm
  const { data: matter } = await supabase
    .from("matters")
    .select("id, firm_id")
    .eq("id", matterId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!matter) {
    return { success: false, message: "Matter not found or access denied." };
  }

  // Get existing finance record
  const { data: existingFinance } = await supabase
    .from("finances")
    .select("id, fee_paid, payment_history")
    .eq("matter_id", matterId)
    .maybeSingle();

  if (existingFinance) {
    // Update existing finance record
    const { error: updateError } = await supabase
      .from("finances")
      .update({
        fee_total: feeTotal,
      })
      .eq("id", existingFinance.id);

    if (updateError) {
      console.error("Error updating fee total:", updateError);
      return { success: false, message: `Unable to update fee total: ${updateError.message}` };
    }
  } else {
    // Create new finance record
    const { error: insertError } = await supabase.from("finances").insert({
      firm_id: profile.firm_id,
      matter_id: matterId,
      fee_total: feeTotal,
      fee_paid: 0,
      payment_history: [],
    });

    if (insertError) {
      console.error("Error creating finance:", insertError);
      return { success: false, message: `Unable to set fee total: ${insertError.message}` };
    }
  }

  revalidatePath(`/cases/${matterId}`);
  revalidatePath("/cases");

  return { success: true };
}

export async function addCaseHistoryEntry(formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "You must be signed in to add timeline entries." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "Join or create a firm before adding timeline entries." };
  }

  const matterId = formData.get("matterId");
  const date = formData.get("date");
  const details = formData.get("details");
  const stage = formData.get("stage");
  const courtName = formData.get("courtName");
  const hearingDate = formData.get("hearingDate");
  const caseNumber = formData.get("caseNumber");
  const nextHearingReason = formData.get("nextHearingReason");

  if (typeof matterId !== "string" || matterId.length === 0) {
    return { success: false, message: "Matter reference missing." };
  }

  if (typeof date !== "string" || date.length === 0) {
    return { success: false, message: "Date is required." };
  }

  if (typeof details !== "string" || details.length === 0) {
    return { success: false, message: "Details are required." };
  }

  // Verify the matter belongs to the user's firm
  const { data: matter } = await supabase
    .from("matters")
    .select("id, firm_id")
    .eq("id", matterId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!matter) {
    return { success: false, message: "Matter not found or access denied." };
  }

  const { error: insertError } = await supabase.from("case_histories").insert({
    firm_id: profile.firm_id,
    matter_id: matterId,
    date: date,
    details: details.trim(),
    stage: typeof stage === "string" && stage.length > 0 ? stage : null,
    court_name: typeof courtName === "string" && courtName.length > 0 ? courtName : null,
    hearing_date: typeof hearingDate === "string" && hearingDate.length > 0 ? hearingDate : null,
    case_number: typeof caseNumber === "string" && caseNumber.length > 0 ? caseNumber : null,
    next_hearing_reason: typeof nextHearingReason === "string" && nextHearingReason.length > 0 ? nextHearingReason : null,
    updated_by: user.id,
  });

  if (insertError) {
    console.error("Error inserting case history:", insertError);
    return { success: false, message: `Unable to add timeline entry: ${insertError.message}` };
  }

  revalidatePath(`/cases/${matterId}`);
  revalidatePath("/cases");

  return { success: true };
}
