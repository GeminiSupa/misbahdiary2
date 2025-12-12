"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateTimeEntrySchema = z.object({
  id: z.string().uuid(),
  description: z.string().optional().nullable(),
  duration_minutes: z.number().int().min(0).optional(),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional().nullable(),
  billable: z.boolean().optional(),
  billing_rate: z.number().min(0).optional().nullable(),
});

export async function stopTimer(): Promise<{ success: boolean; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "You must be signed in to stop the timer." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "You must belong to a firm." };
  }

  const now = new Date();
  const { data: runningEntry, error: fetchError } = await supabase
    .from("time_entries")
    .select("id, started_at, billing_rate")
    .eq("user_id", user.id)
    .eq("firm_id", profile.firm_id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !runningEntry) {
    return { success: false, message: "No running timer found." };
  }

  const startedAt = new Date(runningEntry.started_at);
  const durationMinutes = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
  const amount =
    runningEntry.billing_rate != null
      ? Number(runningEntry.billing_rate) * (durationMinutes / 60)
      : null;

  const { error: updateError } = await supabase
    .from("time_entries")
    .update({
      ended_at: now.toISOString(),
      duration_minutes: durationMinutes,
      amount,
    })
    .eq("id", runningEntry.id);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  revalidatePath("/time-tracking");
  revalidatePath("/", "layout");

  return { success: true };
}

export async function updateTimeEntry(
  formData: FormData,
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "You must be signed in to update time entries." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "You must belong to a firm." };
  }

  const rawData = {
    id: formData.get("id") as string,
    description: formData.get("description") as string | null,
    duration_minutes: formData.get("duration_minutes")
      ? Number(formData.get("duration_minutes"))
      : undefined,
    started_at: formData.get("started_at") as string | undefined,
    ended_at: formData.get("ended_at") as string | null | undefined,
    billable: formData.get("billable") === "true" || formData.get("billable") === "on",
    billing_rate: formData.get("billing_rate") ? Number(formData.get("billing_rate")) : null,
  };

  const validation = updateTimeEntrySchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0]?.message ?? "Invalid data" };
  }

  const data = validation.data;

  // Verify the entry belongs to the user
  const { data: entry, error: fetchError } = await supabase
    .from("time_entries")
    .select("id, user_id, firm_id, billing_rate")
    .eq("id", data.id)
    .eq("user_id", user.id)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (fetchError || !entry) {
    return { success: false, message: "Time entry not found or access denied." };
  }

  // Calculate amount if billable and billing_rate exists
  let amount = null;
  if (data.billable !== false && (entry.billing_rate || data.billing_rate)) {
    const rate = data.billing_rate ?? entry.billing_rate ?? 0;
    const duration = data.duration_minutes ?? 0;
    amount = rate * (duration / 60);
  }

  const updateData: any = {};
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes;
  if (data.started_at !== undefined) updateData.started_at = data.started_at;
  if (data.ended_at !== undefined) updateData.ended_at = data.ended_at || null;
  if (data.billable !== undefined) updateData.billable = data.billable;
  if (data.billing_rate !== undefined) updateData.billing_rate = data.billing_rate;
  if (amount !== null) updateData.amount = amount;

  const { error: updateError } = await supabase
    .from("time_entries")
    .update(updateData)
    .eq("id", data.id);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  revalidatePath("/time-tracking");
  revalidatePath("/", "layout");

  return { success: true };
}

export async function deleteTimeEntry(
  entryId: string,
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "You must be signed in to delete time entries." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { success: false, message: "You must belong to a firm." };
  }

  // Verify the entry belongs to the user
  const { data: entry, error: fetchError } = await supabase
    .from("time_entries")
    .select("id, user_id, firm_id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (fetchError || !entry) {
    return { success: false, message: "Time entry not found or access denied." };
  }

  const { error: deleteError } = await supabase.from("time_entries").delete().eq("id", entryId);

  if (deleteError) {
    return { success: false, message: deleteError.message };
  }

  revalidatePath("/time-tracking");
  revalidatePath("/", "layout");

  return { success: true };
}

