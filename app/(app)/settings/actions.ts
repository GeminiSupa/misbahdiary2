"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logPasswordChanged, logUserCreated, logUserUpdated, logUserDeleted } from "@/lib/audit/logger";
import { billingSettingsSchema } from "@/lib/validation/settings";

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

  // Rate limiting: Check recent password change attempts
  // In production, use Redis or database for rate limiting
  // For now, we'll use a simple approach with session storage on client side

  // Verify current password by attempting to sign in
  // Note: This will create a new session, but we'll restore the original session
  const { data: verifySession, error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.data.currentPassword,
  });

  if (verifyError || !verifySession.user) {
    return {
      message: "Current password is incorrect.",
      fieldErrors: {
        currentPassword: ["Current password is incorrect"],
      },
    };
  }

  // Restore original session by getting user again
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    return {
      message: "Session error. Please try again.",
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

  // Send email notification
  const { sendPasswordChangeNotification } = await import("@/lib/email/service");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email || "User";
  const timestamp = new Date().toLocaleString();
  
  await sendPasswordChangeNotification(user.email!, userName, timestamp).catch((error) => {
    console.error("Failed to send password change notification email:", error);
    // Don't fail the operation if email fails
  });

  // Log audit event
  await logPasswordChanged(user.id).catch((error) => {
    console.error("Failed to log audit event:", error);
    // Don't fail the operation if audit logging fails
  });

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

  // Check if user can send invitations (Firm Owners and Principal Partners)
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canInvite = isOwner || profile.role === "principal_partner";

  if (!canInvite) {
    return {
      message: "Only Firm Owners and Principal Partners can send invitations to add team members.",
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

  // Send invitation email
  const { sendInvitationEmail } = await import("@/lib/email/service");
  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const inviterName = inviterProfile?.full_name || undefined;
  
  await sendInvitationEmail(parsed.data.email, parsed.data.role, token, inviterName).catch((error) => {
    console.error("Failed to send invitation email:", error);
    // Don't fail the operation if email fails
  });

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
  // Only Firm Owners can create users directly
  const canCreateUsers = isOwner;

  if (!canCreateUsers) {
    return {
      message: "Only Firm Owners can create user accounts. Principal Partners can send invitations instead.",
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
    // Check if the existing user is already in another firm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProfile } = await (supabaseAdminClient as any)
      .from("profiles")
      .select("firm_id, full_name")
      .eq("id", existingUser.id)
      .maybeSingle();

    if (existingProfile?.firm_id) {
      return {
        message: `A user with this email already exists and is part of another firm. They cannot be added to your firm.`,
      };
    }
    // If user exists but has no firm, we can still create them (they might be orphaned)
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

    // Wait briefly for trigger to complete (100ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Use admin client to update profile (bypasses RLS and ensures it works)
    // Use upsert to handle both cases atomically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileUpsertError } = await (supabaseAdminClient as any)
      .from("profiles")
      .upsert(
        {
          id: newUser.user.id,
          firm_id: actorProfile.firm_id,
          role: parsed.data.role,
          full_name: parsed.data.fullName,
          created_by: user.id, // Track who created this user
        },
        {
          onConflict: "id",
        },
      );

    if (profileUpsertError) {
      console.error("Failed to upsert profile after user creation:", profileUpsertError);
      // Try to delete the user account if profile creation fails
      await supabaseAdminClient.auth.admin.deleteUser(newUser.user.id).catch(() => {
        // Ignore errors during cleanup
      });
      return {
        message:
          "User account was created but profile setup failed. The account has been removed. Please try again.",
      };
    }

    // Verify profile was created correctly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: verifyProfile, error: verifyError } = await (supabaseAdminClient as any)
      .from("profiles")
      .select("id, firm_id, role, created_by, full_name")
      .eq("id", newUser.user.id)
      .single();

    if (verifyError || !verifyProfile) {
      console.error("Failed to verify profile after creation:", verifyError);
      // Try to delete the user account if verification fails
      await supabaseAdminClient.auth.admin.deleteUser(newUser.user.id).catch(() => {
        // Ignore errors during cleanup
      });
      return {
        message:
          "User account was created but profile verification failed. The account has been removed. Please try again.",
      };
    }

    // Type assertion for verifyProfile - cast through unknown first
    const verifiedProfile = verifyProfile as unknown as {
      id: string;
      firm_id: string | null;
      role: string | null;
      created_by: string | null;
      full_name: string | null;
    };

    // Verify all fields are set correctly
    if (verifiedProfile.firm_id !== actorProfile.firm_id) {
      console.error("Profile firm_id mismatch:", {
        expected: actorProfile.firm_id,
        actual: verifiedProfile.firm_id,
      });
      return {
        message: "User was created but firm assignment failed. Please contact support.",
      };
    }

    if (verifiedProfile.role !== parsed.data.role) {
      console.error("Profile role mismatch:", {
        expected: parsed.data.role,
        actual: verifiedProfile.role,
      });
      // Try to fix the role
      const { error: fixRoleError } = await supabaseAdminClient
        .from("profiles")
        .update({ role: parsed.data.role })
        .eq("id", newUser.user.id);

      if (fixRoleError) {
        return {
          message: `User was created but role assignment failed. Expected ${parsed.data.role} but got ${verifiedProfile.role}. Please contact support.`,
        };
      }
    }

    if (verifiedProfile.created_by !== user.id) {
      console.error("Profile created_by mismatch:", {
        expected: user.id,
        actual: verifiedProfile.created_by,
      });
      // Try to fix created_by
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: fixCreatedByError } = await (supabaseAdminClient as any)
        .from("profiles")
        .update({ created_by: user.id })
        .eq("id", newUser.user.id);

      if (fixCreatedByError) {
        console.error("Failed to fix created_by:", fixCreatedByError);
        // Don't fail the operation for this, just log it
      }
    }

    // Final verification: Ensure the team member is properly set up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: finalCheck } = await (supabaseAdminClient as any)
      .from("profiles")
      .select("id, firm_id, role, created_by, full_name, email")
      .eq("id", newUser.user.id)
      .single();

    const finalProfile = finalCheck as unknown as {
      id: string;
      firm_id: string | null;
      role: string | null;
      created_by: string | null;
      full_name: string | null;
      email?: string | null;
    } | null;

    if (!finalProfile || finalProfile.firm_id !== actorProfile.firm_id || finalProfile.role !== parsed.data.role) {
      console.error("Final verification failed:", {
        profile: finalProfile,
        expected: {
          firm_id: actorProfile.firm_id,
          role: parsed.data.role,
        },
      });
      return {
        message: `Team member was created but verification failed. Please refresh the page and check the team list. If the issue persists, contact support.`,
      };
    }

    // Send welcome email
    const { sendUserCreatedEmail } = await import("@/lib/email/service");
    const { data: firmData } = await supabase
      .from("firms")
      .select("name")
      .eq("id", actorProfile.firm_id)
      .maybeSingle();

    const firmName = firmData?.name || "the firm";
    
    await sendUserCreatedEmail(
      parsed.data.email,
      parsed.data.password,
      parsed.data.fullName,
      firmName
    ).catch((error) => {
      console.error("Failed to send user creation email:", error);
      // Don't fail the operation if email fails
    });

    // Log audit event
    await logUserCreated(newUser.user.id, parsed.data.email, parsed.data.role).catch((error) => {
      console.error("Failed to log audit event:", error);
      // Don't fail the operation if audit logging fails
    });

    // Force revalidation of all relevant paths
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/cases");

    return { 
      success: true,
      message: `Team member "${parsed.data.fullName}" has been successfully added to your firm with the role "${parsed.data.role}". They can now sign in and will have access based on their role.`,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      message: error instanceof Error ? error.message : "Failed to create user account",
    };
  }
}

export async function updateBillingSettings(
  values: z.infer<typeof billingSettingsSchema>,
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = billingSettingsSchema.safeParse(values);
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
    return { message: "Join or create a firm before updating billing settings." };
  }

  // Check if user can edit billing settings (Firm Owners and Principal Partners)
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canEdit = isOwner || profile.role === "principal_partner";

  if (!canEdit) {
    return { message: "Only Firm Owners and Principal Partners can update billing settings." };
  }

  // Upsert billing settings
  // Note: billing_settings table not in TypeScript types yet, using type assertion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upsertError } = await (supabase as any)
    .from("billing_settings")
    .upsert(
      {
        firm_id: profile.firm_id,
        invoice_prefix: parsed.data.invoicePrefix,
        invoice_number_format: parsed.data.invoiceNumberFormat,
        next_invoice_number: parsed.data.nextInvoiceNumber,
        default_payment_terms_days: parsed.data.defaultPaymentTermsDays,
        default_currency: parsed.data.defaultCurrency,
        sales_tax_rate: parsed.data.salesTaxRate,
        sales_tax_label: parsed.data.salesTaxLabel,
        tax_registration_number: parsed.data.taxRegistrationNumber || null,
        sales_tax_registration_number: parsed.data.salesTaxRegistrationNumber || null,
        payment_methods: parsed.data.paymentMethods,
        bank_name: parsed.data.bankName || null,
        account_title: parsed.data.accountTitle || null,
        account_number: parsed.data.accountNumber || null,
        iban: parsed.data.iban || null,
        swift_code: parsed.data.swiftCode || null,
        branch_code: parsed.data.branchCode || null,
        branch_address: parsed.data.branchAddress || null,
        invoice_footer: parsed.data.invoiceFooter || null,
        invoice_notes: parsed.data.invoiceNotes || null,
        auto_generate_invoice_number: parsed.data.autoGenerateInvoiceNumber,
      },
      {
        onConflict: "firm_id",
      },
    );

  if (upsertError) {
    return { message: `Could not update billing settings: ${upsertError.message}` };
  }

  revalidatePath("/settings");
  revalidatePath("/billing");

  return { success: true };
}

// Update team member schema
const updateTeamMemberSchema = z.object({
  teamMemberId: z.string().uuid("Invalid user ID"),
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

export async function updateTeamMember(
  values: z.infer<typeof updateTeamMemberSchema>,
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const parsed = updateTeamMemberSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Check if actor can manage team members
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!actorProfile?.firm_id) {
    return { message: "Join or create a firm before managing team members." };
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", actorProfile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canManageTeam = isOwner || actorProfile.role === "principal_partner";

  if (!canManageTeam) {
    return {
      message: "Only Firm Owners and Principal Partners can manage team members.",
    };
  }

  // Check if target user is in the same firm
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", parsed.data.teamMemberId)
    .maybeSingle();

  if (!targetProfile) {
    return { message: "Team member not found." };
  }

  if (targetProfile.firm_id !== actorProfile.firm_id) {
    return { message: "You can only manage team members in your own firm." };
  }

  // Prevent changing firm owner's role
  if (firm?.owner_id === parsed.data.teamMemberId && parsed.data.role !== "principal_partner") {
    return {
      message: "Cannot change the firm owner's role. The owner must remain a Principal Partner.",
    };
  }

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      role: parsed.data.role,
    })
    .eq("id", parsed.data.teamMemberId)
    .eq("firm_id", actorProfile.firm_id);

  if (updateError) {
    return { message: `Could not update team member: ${updateError.message}` };
  }

  // Update auth.users metadata for role consistency
  const { supabaseAdminClient } = await import("@/lib/supabase/admin");
  const { error: authUpdateError } = await supabaseAdminClient.auth.admin.updateUserById(
    parsed.data.teamMemberId,
    {
      user_metadata: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      },
    },
  );

  if (authUpdateError) {
    console.error("Failed to update auth user metadata for team member:", authUpdateError);
    // Don't fail the entire operation, but log the error
  }

  // Log audit event
  await logUserUpdated(parsed.data.teamMemberId, parsed.data.fullName, parsed.data.role).catch(
    (error) => {
      console.error("Failed to log audit event:", error);
    },
  );

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Team member "${parsed.data.fullName}" has been updated successfully.`,
  };
}

export async function deleteTeamMember(teamMemberId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  // Check if actor can manage team members
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!actorProfile?.firm_id) {
    return { message: "Join or create a firm before managing team members." };
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", actorProfile.firm_id)
    .maybeSingle();

  const isOwner = firm?.owner_id === user.id;
  const canManageTeam = isOwner || actorProfile.role === "principal_partner";

  if (!canManageTeam) {
    return {
      message: "Only Firm Owners and Principal Partners can delete team members.",
    };
  }

  // Prevent deleting yourself
  if (teamMemberId === user.id) {
    return { message: "You cannot delete your own account from here." };
  }

  // Prevent deleting firm owner
  if (teamMemberId === firm?.owner_id) {
    return {
      message: "The firm owner's account cannot be deleted.",
    };
  }

  // Get the team member's profile to ensure they belong to the current firm
  const { data: teamMemberProfile, error: fetchProfileError } = await supabase
    .from("profiles")
    .select("firm_id, full_name")
    .eq("id", teamMemberId)
    .maybeSingle();

  if (fetchProfileError || !teamMemberProfile) {
    return { message: "Team member not found." };
  }

  const teamMemberData = teamMemberProfile as { firm_id: string | null; full_name: string | null };
  
  if (teamMemberData.firm_id !== actorProfile.firm_id) {
    return { message: "You can only delete team members from your own firm." };
  }

  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  try {
    // Get email from auth.users for audit log
    const { data: authUser } = await supabaseAdminClient.auth.admin.getUserById(teamMemberId);
    const teamMemberEmail = authUser?.user?.email ?? "unknown";

    // Delete user from Supabase Auth (this will cascade delete the profile)
    const { error: deleteError } = await supabaseAdminClient.auth.admin.deleteUser(teamMemberId);

    if (deleteError) {
      return { message: `Failed to delete team member: ${deleteError.message}` };
    }

    await logUserDeleted(teamMemberId, teamMemberEmail).catch((error) => {
      console.error("Failed to log audit event for user deletion:", error);
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/cases");

    return { success: true, message: `Team member "${teamMemberData.full_name ?? teamMemberEmail}" deleted successfully.` };
  } catch (error) {
    console.error("Error deleting team member:", error);
    return {
      message: error instanceof Error ? error.message : "Failed to delete team member",
    };
  }
}
