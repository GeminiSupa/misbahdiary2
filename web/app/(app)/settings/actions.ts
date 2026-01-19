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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePassword(
  values: z.infer<typeof changePasswordSchema>,
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Verify current password by attempting to sign in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return {
      message: "Current password is incorrect.",
      fieldErrors: {
        currentPassword: ["Current password is incorrect"],
      },
    };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (updateError) {
    return {
      message: `Failed to update password: ${updateError.message}`,
    };
  }

  revalidatePath("/settings");

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
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { message: "Join or create a firm before inviting teammates." };
  }

  // ONLY Principal Partners can send invitations
  if (profile.role !== "principal_partner") {
    return {
      message: "Only Principal Partners can send invitations to add team members.",
    };
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

const createUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum([
    "principal_partner",
    "associate",
    "paralegal",
    "of_counsel",
    "client",
    "staff",
  ]),
});

export async function createUser(
  values: z.infer<typeof createUserSchema>,
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Check if user can create accounts
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!actorProfile?.firm_id) {
    return { message: "Join or create a firm before creating user accounts." };
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", actorProfile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  // ONLY Principal Partners can create users (not Firm Owners)
  const canCreateUsers = actorProfile.role === "principal_partner";

  if (!canCreateUsers) {
    return {
      message: "Only Principal Partners can create user accounts. Firm Owners cannot create users directly.",
    };
  }

  // Use Supabase Admin client to create user
  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  // Check if user with this email already exists (using admin client to check auth.users)
  const { data: existingUsers } = await supabaseAdminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase()
  );

  if (existingUser) {
    return { message: "A user with this email already exists." };
  }

  try {
    // Create user via Supabase Admin API
    const { data: newUser, error: createError } = await supabaseAdminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: parsed.data.role,
        full_name: parsed.data.fullName,
      },
    });

    if (createError || !newUser.user) {
      return {
        message: createError?.message || "Failed to create user account",
      };
    }

    // Update the profile with firm_id and role
    // The profile should be auto-created by the trigger, but we'll update it
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        firm_id: actorProfile.firm_id,
        role: parsed.data.role,
        full_name: parsed.data.fullName,
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      // Profile might not exist yet, try inserting
      const { error: insertError } = await supabase.from("profiles").insert({
        id: newUser.user.id,
        firm_id: actorProfile.firm_id,
        role: parsed.data.role,
        full_name: parsed.data.fullName,
      });

      if (insertError) {
        console.error("Failed to create/update profile after user creation:", insertError);
        return {
          message:
            "User account was created but profile setup failed. Please contact support.",
        };
      }
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      message: error instanceof Error ? error.message : "Failed to create user account",
    };
  }
}

