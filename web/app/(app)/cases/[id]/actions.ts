"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DOCUMENT_BUCKET = "case_files";

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
