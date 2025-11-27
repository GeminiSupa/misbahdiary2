"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
      .regex(/^\d{13}$/, "CNIC must be 13 digits")
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

  const normalizedPayload = {
    type: payload.type,
    name: payload.fullName,
    full_name: payload.fullName,
    father_name: payload.fatherName,
    organization_name: payload.organizationName || null,
    email: payload.email || null,
    phone: payload.phone || null,
    cnic: payload.cnic || null,
    address: payload.address,
    representation: payload.representation,
    representative_details:
      payload.representation === "representative"
        ? {
            to_whom: payload.representativeToWhom,
            capacity: payload.representativeCapacity,
          }
        : null,
    city: payload.city || null,
    province: payload.province || null,
    country: payload.country || "Pakistan",
    notes: payload.notes || null,
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
      })
      .eq("id", payload.id);

    if (updateError) {
      return { message: `Could not update client: ${updateError.message}` };
    }

    revalidatePath("/clients");
    revalidatePath(`/clients/${payload.id}`);
    revalidatePath("/cases");

    return { success: true };
  }

  const { error: insertError } = await supabase.from("clients").insert({
    ...normalizedPayload,
    firm_id: profile.firm_id,
    created_by: user.id,
  });

  if (insertError) {
    return { message: `Could not create client: ${insertError.message}` };
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
  const path = `${profile.firm_id}/clients/${clientId}/${Date.now()}-${safeName}`;

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


