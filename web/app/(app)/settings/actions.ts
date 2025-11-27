"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().optional().or(z.literal("")),
  languagePreference: z.enum(["en", "ur"]).default("en"),
});

const firmSchema = z.object({
  name: z.string().min(2, "Firm name is required"),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

const invitationSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum([
    "principal_partner",
    "associate",
    "paralegal",
    "of_counsel",
    "client",
    "staff",
  ]),
});

const notificationSchema = z.object({
  hearingReminders: z.boolean(),
  invoiceReminders: z.boolean(),
  announcementUpdates: z.boolean(),
});

const staffSchema = z.object({
  userId: z.string().uuid("Select a teammate"),
  role: z.enum(["junior", "senior", "staff"]),
  assignedCourts: z.array(z.string()).optional(),
  assignedDistricts: z.array(z.string()).optional(),
});

type ActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProfileSettings(values: z.infer<typeof profileSchema>): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { message: "Profile not found." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      language_preference: parsed.data.languagePreference,
    })
    .eq("id", user.id);

  if (updateError) {
    return { message: `Could not update profile: ${updateError.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateFirmSettings(values: z.infer<typeof firmSchema>): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = firmSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { message: "Join or create a firm before updating its details." };
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  if (!firm) {
    return { message: "Firm not found." };
  }

  if (firm.owner_id !== user.id) {
    return { message: "Only the firm owner can update firm details." };
  }

  const { error: updateError } = await supabase
    .from("firms")
    .update({
      name: parsed.data.name,
      contact_email: parsed.data.contactEmail,
      contact_phone: parsed.data.contactPhone || null,
      address: parsed.data.address || null,
    })
    .eq("id", profile.firm_id);

  if (updateError) {
    return { message: `Could not update firm: ${updateError.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateNotificationPreferences(
  values: z.infer<typeof notificationSchema>,
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = notificationSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error: upsertError } = await supabase.from("notification_preferences").upsert({
    profile_id: user.id,
    hearing_reminders: parsed.data.hearingReminders,
    invoice_reminders: parsed.data.invoiceReminders,
    announcement_updates: parsed.data.announcementUpdates,
  });

  if (upsertError) {
    return { message: `Could not update notifications: ${upsertError.message}` };
  }

  revalidatePath("/settings");

  return { success: true };
}

export async function createInvitation(values: z.infer<typeof invitationSchema>): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = invitationSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { message: "Join or create a firm before inviting teammates." };
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const token = randomBytes(24).toString("hex");

  const { error: insertError } = await supabase.from("firm_invitations").insert({
    firm_id: profile.firm_id,
    email: parsed.data.email,
    role: parsed.data.role,
    token,
    invited_by: user.id,
    expires_at: expiresAt,
  });

  if (insertError) {
    return { message: `Could not create invitation: ${insertError.message}` };
  }

  revalidatePath("/settings");

  return { success: true };
}

export async function revokeInvitation(invitationId: string): Promise<ActionState> {
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
    return { message: "Join or create a firm before managing invitations." };
  }

  const { error: updateError } = await supabase
    .from("firm_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("firm_id", profile.firm_id);

  if (updateError) {
    return { message: `Could not revoke invitation: ${updateError.message}` };
  }

  revalidatePath("/settings");

  return { success: true };
}

export async function upsertStaffMember(
  values: z.infer<typeof staffSchema>,
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = staffSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!actorProfile?.firm_id) {
    return { message: "Join or create a firm before managing staff." };
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", actorProfile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canManageStaff = isOwner || actorProfile.role === "principal_partner";

  if (!canManageStaff) {
    return { message: "Only firm owners or principal partners can manage staff." };
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", parsed.data.userId)
    .eq("firm_id", actorProfile.firm_id)
    .maybeSingle();

  if (!targetProfile) {
    return { message: "Selected teammate is not part of this firm." };
  }

  const normalise = (input?: string[]) =>
    (input ?? []).map((item) => item.trim()).filter(Boolean);

  const { error: upsertError } = await supabase.from("staff").upsert({
    user_id: parsed.data.userId,
    firm_id: actorProfile.firm_id,
    role: parsed.data.role,
    assigned_courts: normalise(parsed.data.assignedCourts),
    assigned_districts: normalise(parsed.data.assignedDistricts),
  });

  if (upsertError) {
    return { message: `Unable to save staff member: ${upsertError.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/cases");

  return { success: true };
}

export async function removeStaffMember(staffUserId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!actorProfile?.firm_id) {
    return { message: "Join or create a firm before managing staff." };
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", actorProfile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canManageStaff = isOwner || actorProfile.role === "principal_partner";

  if (!canManageStaff) {
    return { message: "Only firm owners or principal partners can manage staff." };
  }

  const { error: deleteError } = await supabase
    .from("staff")
    .delete()
    .eq("user_id", staffUserId)
    .eq("firm_id", actorProfile.firm_id);

  if (deleteError) {
    return { message: `Unable to remove staff member: ${deleteError.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/cases");

  return { success: true };
}

