"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logClientCreated, logClientDeleted } from "@/lib/audit/logger";
import {
  clientTypeOptions,
  clientRepresentationOptions,
  representativeCapacityOptions,
} from "@/lib/constants/clients";

const DOCUMENT_BUCKET = "case_files";

const clientSchema = z
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
      .refine((val) => !val || /^\d{13}$/.test(val), {
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
    organizationName: z.string().optional(),
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
          message: "Specify who the client represents.",
        });
      }
      if (!data.representativeCapacity) {
        ctx.addIssue({
          path: ["representativeCapacity"],
          code: z.ZodIssueCode.custom,
          message: "Select a representative capacity.",
        });
      }
    }
  });

export type ClientFormValues = z.infer<typeof clientSchema>;

type ActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function saveClient(values: ClientFormValues): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = clientSchema.safeParse(values);

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
    return { message: "You must belong to a firm before managing clients." };
  }

  // Ensure full_name is not empty (required by database)
  if (!payload.fullName || payload.fullName.trim().length === 0) {
    return { message: "Full name is required and cannot be empty." };
  }

  // Ensure address is not empty (required by validation)
  if (!payload.address || payload.address.trim().length === 0) {
    return { message: "Address is required and cannot be empty." };
  }

  // Ensure fatherName is not empty (required by validation)
  if (!payload.fatherName || payload.fatherName.trim().length === 0) {
    return { message: "Father/guardian name is required and cannot be empty." };
  }

  // Normalize empty strings to null for optional fields
  const normalizeString = (value: string | undefined): string | null => {
    if (!value || value.trim().length === 0) return null;
    return value.trim();
  };

  const normalizedPayload = {
    type: payload.type,
    name: payload.fullName.trim(),
    full_name: payload.fullName.trim(),
    father_name: payload.fatherName.trim(),
    organization_name: normalizeString(payload.organizationName),
    email: normalizeString(payload.email),
    phone: normalizeString(payload.phone),
    cnic: normalizeString(payload.cnic),
    address: payload.address.trim(),
    representation: payload.representation,
    representative_details:
      payload.representation === "representative"
        ? {
            to_whom: normalizeString(payload.representativeToWhom) || null,
            capacity: payload.representativeCapacity || null,
          }
        : null,
    city: normalizeString(payload.city),
    province: normalizeString(payload.province),
    country: normalizeString(payload.country) || "Pakistan",
    notes: normalizeString(payload.notes),
  };

  if (payload.id) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id, firm_id")
      .eq("id", payload.id)
      .maybeSingle();

    if (!existing || existing.firm_id !== profile.firm_id) {
      return { message: "Client not found or you do not have access." };
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        ...normalizedPayload,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", payload.id);

    if (updateError) {
      return { message: `Could not update client: ${updateError.message}` };
    }

    revalidatePath("/clients");
    revalidatePath(`/clients/${payload.id}`);
    revalidatePath("/cases");

    return { success: true };
  }

  const insertData = {
    ...normalizedPayload,
    firm_id: profile.firm_id,
    created_by: user.id,
  } as any;

  // Log for debugging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log("[saveClient] Inserting client data:", JSON.stringify(insertData, null, 2));
  }

  // Use the admin client for insert to bypass RLS if needed, or ensure RLS is properly configured
  const { data: insertedData, error: insertError } = await supabase
    .from("clients")
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    // Log detailed error for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("[saveClient] Insert error:", insertError);
      console.error("[saveClient] Error code:", insertError.code);
      console.error("[saveClient] Error details:", insertError.details);
      console.error("[saveClient] Error hint:", insertError.hint);
    }
    
    // Return user-friendly error message
    const errorMessage = insertError.message || "Unknown error occurred";
    return { 
      message: `Could not create client: ${errorMessage}`,
      fieldErrors: insertError.code === "23505" ? {
        // Unique constraint violation
        email: insertError.message.includes("email") ? ["This email is already in use"] : undefined,
        cnic: insertError.message.includes("cnic") ? ["This CNIC is already registered"] : undefined,
      } as Record<string, string[]> : undefined,
    };
  }

  if (!insertedData) {
    return { message: "Client was created but no data was returned. Please refresh the page." };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[saveClient] Client created successfully:", insertedData);
  }

  // Log audit event for new clients
  if (!payload.id) {
    await logClientCreated(insertedData.id, parsed.data.fullName).catch((error) => {
      console.error("Failed to log audit event:", error);
    });
  }

  revalidatePath("/clients");
  revalidatePath("/cases");

  return { success: true };
}

export async function uploadClientDocument(formData: FormData) {
  const clientId = formData.get("clientId");
  const file = formData.get("file");

  if (typeof clientId !== "string" || clientId.length === 0) {
    return { success: false, message: "Client reference missing." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Please select a file to upload. The file must not be empty." };
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      success: false, 
      message: `File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please compress or use a smaller file.` 
    };
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
  const path = `${profile.firm_id}/clients/${clientId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) {
    // Provide helpful error message for missing bucket
    if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
      return {
        success: false,
        message: `Storage bucket "${DOCUMENT_BUCKET}" not found. Please run: npm run supabase:setup-storage`,
      };
    }
    // Provide user-friendly error message
    if (uploadError.message?.includes("duplicate") || uploadError.message?.includes("already exists")) {
      return {
        success: false,
        message: "A file with this name already exists. Please rename the file and try again.",
      };
    }
    return { 
      success: false, 
      message: `Unable to upload file. ${uploadError.message}. Please try again or contact support at /contact if the issue persists.` 
    };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    firm_id: profile.firm_id,
    case_id: null,
    matter_id: null,
    storage_path: path,
    file_name: file.name,
    uploaded_by: user.id,
    metadata: {
      kind: "client_document",
      clientId,
    },
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
    return {
      success: false,
      message: `Unable to save document metadata: ${insertError.message}`,
    };
  }

  revalidatePath(`/clients/${clientId}`);

  return { success: true };
}

export async function getSignedClientDocumentUrl(documentId: string) {
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
    .select("id, storage_path, firm_id")
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

export async function deleteClient(clientId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "Join or create a firm before managing clients." };
  }

  // Check permissions - only Firm Owners and Principal Partners can delete clients
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canDelete = isOwner || profile.role === "principal_partner";

  if (!canDelete) {
    return { success: false, message: "Only Firm Owners and Principal Partners can delete clients." };
  }

  // Check if client exists and belongs to the firm
  const { data: client } = await supabase
    .from("clients")
    .select("id, firm_id, full_name")
    .eq("id", clientId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!client) {
    return { success: false, message: "Client not found or you do not have access." };
  }

  const clientName = client.full_name || "Unknown Client";

  // Check for associated matters (cascade check)
  const { data: matters, error: mattersError } = await supabase
    .from("matters")
    .select("id, serial_number")
    .eq("client_id", clientId)
    .limit(1);

  if (mattersError) {
    return { success: false, message: `Error checking associated matters: ${mattersError.message}` };
  }

  if (matters && matters.length > 0) {
    return {
      success: false,
      message: `Cannot delete client. This client has ${matters.length} associated matter(s). Please remove or reassign the matters first.`,
    };
  }

  // Check for associated invoices
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("id, invoice_number")
    .eq("client_id", clientId)
    .limit(1);

  if (invoicesError) {
    return { success: false, message: `Error checking associated invoices: ${invoicesError.message}` };
  }

  if (invoices && invoices.length > 0) {
    return {
      success: false,
      message: `Cannot delete client. This client has ${invoices.length} associated invoice(s). Please remove or reassign the invoices first.`,
    };
  }

  // Delete associated documents from storage
  const { data: documents } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("firm_id", profile.firm_id)
    .contains("metadata", { kind: "client_document", clientId });

  if (documents && documents.length > 0) {
    const paths = documents.map((doc) => doc.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove(paths);
    }
  }

  // Delete client
  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("firm_id", profile.firm_id);

  if (deleteError) {
    return { success: false, message: `Could not delete client: ${deleteError.message}` };
  }

  // Log audit event
  await logClientDeleted(clientId, clientName).catch((error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to log audit event:", error);
    }
  });

  revalidatePath("/clients");
  revalidatePath("/cases");

  return { success: true };
}


