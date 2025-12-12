"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotificationsForRecipients } from "@/lib/server/notifications";
import { getRecipientIdsForPreference } from "@/lib/server/preferences";
import { scheduleValidationSchema, updateSchema } from "@/lib/validation/hearings";

export type HearingFormValues = z.infer<typeof scheduleValidationSchema>;

type ActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function scheduleHearing(values: HearingFormValues): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = scheduleValidationSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields.",
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
    return { message: "You must belong to a firm before scheduling hearings." };
  }

  const scheduledAtIso = new Date(payload.scheduledAt).toISOString();

  const { data: insertedHearing, error: insertError } = await supabase
    .from("hearings")
    // Cast to any to avoid strict type mismatches between DB enums and app schema
    .insert({
      firm_id: profile.firm_id,
      matter_id: payload.matterId,
      scheduled_at: scheduledAtIso,
      duration_minutes: payload.durationMinutes,
      location: payload.location || null,
      status: payload.status as any,
      notes: payload.notes || null,
    } as any)
    .select("id")
    .single();

  if (insertError || !insertedHearing) {
    return { message: `Could not schedule hearing: ${insertError?.message ?? "Unknown error"}` };
  }

  const { data: matterInfo } = await supabase
    .from("matters")
    .select("id, serial_number, case_number, court_name, assigned_attorneys")
    .eq("id", payload.matterId)
    .maybeSingle();

  if (!matterInfo) {
    return { message: "Linked matter not found." };
  }

  const assigned =
    Array.isArray(matterInfo.assigned_attorneys) && matterInfo.assigned_attorneys.length > 0
      ? (matterInfo.assigned_attorneys as string[])
      : [];
  const notifiedUsers = assigned.length > 0 ? assigned : [user.id];

  await supabase.from("calendar_events").upsert(
    {
      firm_id: profile.firm_id,
      matter_id: matterInfo.id,
      hearing_id: insertedHearing.id,
      event_type: "hearing",
      event_date: scheduledAtIso.slice(0, 10),
      description: `Hearing at ${matterInfo.court_name ?? "court"}`,
      notified_users: notifiedUsers,
      created_by: user.id,
    },
    { onConflict: "hearing_id" },
  );

  const recipients = await getRecipientIdsForPreference(
    supabase,
    profile.firm_id,
    "hearing_reminders",
  );

  await createNotificationsForRecipients({
    firmId: profile.firm_id,
    title: "New hearing scheduled",
    message: `Hearing for ${matterInfo.serial_number ?? matterInfo.case_number ?? "matter"} is set for ${new Date(
      scheduledAtIso,
    ).toLocaleString()}.`,
    type: "hearing",
    link: "/calendar",
    relatedEntity: "hearing",
    relatedId: insertedHearing.id,
  }, recipients);

  revalidatePath("/calendar");
  revalidatePath("/cases");

  return { success: true };
}

export type HearingUpdateValues = z.infer<typeof updateSchema>;

export async function updateHearing(values: HearingUpdateValues): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = updateSchema.safeParse(values);

  if (!parsed.success) {
    return {
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
    return { message: "Join or create a firm before updating hearings." };
  }

  const scheduledAtIso = new Date(payload.scheduledAt).toISOString();

  const { error: updateError } = await supabase
    .from("hearings")
    .update({
      matter_id: payload.matterId,
      scheduled_at: scheduledAtIso,
      duration_minutes: payload.durationMinutes,
      location: payload.location || null,
      status: payload.status as any,
      notes: payload.notes || null,
    } as any)
    .eq("id", payload.hearingId)
    .eq("firm_id", profile.firm_id);

  if (updateError) {
    return { message: `Could not update hearing: ${updateError.message}` };
  }

  const { data: matterInfo } = await supabase
    .from("matters")
    .select("id, serial_number, case_number, court_name, assigned_attorneys")
    .eq("id", payload.matterId)
    .maybeSingle();

  if (!matterInfo) {
    return { message: "Linked matter not found." };
  }

  const assigned =
    Array.isArray(matterInfo.assigned_attorneys) && matterInfo.assigned_attorneys.length > 0
      ? (matterInfo.assigned_attorneys as string[])
      : [];
  const notifiedUsers = assigned.length > 0 ? assigned : [user.id];

  await supabase.from("calendar_events").upsert(
    {
      firm_id: profile.firm_id,
      matter_id: matterInfo.id,
      hearing_id: payload.hearingId,
      event_type: "hearing",
      event_date: scheduledAtIso.slice(0, 10),
      description: `Hearing at ${matterInfo.court_name ?? "court"}`,
      notified_users: notifiedUsers,
      created_by: user.id,
    },
    { onConflict: "hearing_id" },
  );

  const recipients = await getRecipientIdsForPreference(
    supabase,
    profile.firm_id,
    "hearing_reminders",
  );

  await createNotificationsForRecipients({
    firmId: profile.firm_id,
    title: "Hearing updated",
    message: `Hearing for ${matterInfo.serial_number ?? matterInfo.case_number ?? "matter"} has been updated to ${new Date(
      scheduledAtIso,
    ).toLocaleString()}.`,
    type: "hearing",
    link: "/calendar",
    relatedEntity: "hearing",
    relatedId: payload.hearingId,
  }, recipients);

  revalidatePath("/calendar");
  revalidatePath("/cases");

  return { success: true };
}

export async function markHearingCompleted(hearingId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { message: "Join or create a firm before updating hearings." };
  }

  const { data: hearing } = await supabase
    .from("hearings")
    .select("id, matter_id")
    .eq("id", hearingId)
    .maybeSingle();

  if (!hearing) {
    return { message: "Hearing not found." };
  }

  const { error: updateError } = await supabase
    .from("hearings")
    .update({ status: "completed" })
    .eq("id", hearingId)
    .eq("firm_id", profile.firm_id);

  if (updateError) {
    return { message: `Could not update hearing: ${updateError.message}` };
  }

  if (hearing.matter_id) {
    await supabase
      .from("calendar_events")
      .update({ event_type: "follow_up", description: "Hearing completed" })
      .eq("hearing_id", hearingId)
      .eq("firm_id", profile.firm_id);
  }

  const { data: matterInfo } = await supabase
    .from("matters")
    .select("serial_number, case_number, assigned_attorneys")
    .eq("id", hearing.matter_id as string)
    .maybeSingle();

  const assigned =
    matterInfo && Array.isArray(matterInfo.assigned_attorneys) && matterInfo.assigned_attorneys.length > 0
      ? (matterInfo.assigned_attorneys as string[])
      : [];

  const recipients = await getRecipientIdsForPreference(
    supabase,
    profile.firm_id,
    "hearing_reminders",
  );

  const fallbackRecipients =
    recipients.length > 0 ? recipients : assigned.length > 0 ? assigned : [user.id];

  await createNotificationsForRecipients(
    {
      firmId: profile.firm_id,
      title: "Hearing marked complete",
      message: `Hearing for ${matterInfo?.serial_number ?? matterInfo?.case_number ?? "matter"} is now marked as completed.`,
      type: "hearing",
      link: "/calendar",
      relatedEntity: "hearing",
      relatedId: hearingId,
    },
    fallbackRecipients,
  );

  revalidatePath("/calendar");
  revalidatePath("/cases");

  return { success: true };
}

