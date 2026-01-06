"use server";

import { acceptInviteSchema } from "@/lib/validation/invite";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdminClient } from "@/lib/supabase/admin";

type ActionResult = {
  success?: boolean;
  message?: string;
  requiresLogin?: boolean;
  redirectTo?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function acceptInvitation(formData: FormData): Promise<ActionResult> {
  const submission = {
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone"),
    languagePreference: formData.get("languagePreference"),
  };

  const parsed = acceptInviteSchema.safeParse(submission);

  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { token, fullName, password, phone, languagePreference } = parsed.data;

  const { data: invitation, error: invitationError } = await supabaseAdminClient
    .from("firm_invitations")
    .select("id, firm_id, email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (invitationError || !invitation) {
    return { message: "Invitation not found or already handled." };
  }

  if (invitation.status !== "pending") {
    return { message: `This invitation is already ${invitation.status}.` };
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    await supabaseAdminClient
      .from("firm_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return { message: "This invitation has expired. Please request a new one." };
  }

  const existingUserResponse = await (supabaseAdminClient.auth.admin as any).getUserByEmail(
    invitation.email,
  );
  const existingUser = existingUserResponse.data?.user ?? null;

  if (existingUser) {
    await supabaseAdminClient
      .from("profiles")
      .update({
        firm_id: invitation.firm_id,
        role: invitation.role,
        full_name: fullName,
        phone: phone || null,
        language_preference: languagePreference,
      })
      .eq("id", existingUser.id);

    await supabaseAdminClient
      .from("firm_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    return {
      success: true,
      requiresLogin: true,
      message:
        "You already have an account. Sign in to access the workspace.",
      redirectTo: `/sign-in?email=${encodeURIComponent(invitation.email)}`,
    };
  }

  const createUserResponse = await supabaseAdminClient.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createUserResponse.error || !createUserResponse.data.user) {
    return {
      message: createUserResponse.error?.message ?? "Unable to create account. Please try again.",
    };
  }

  const newUser = createUserResponse.data.user;

  await supabaseAdminClient
    .from("profiles")
    .update({
      firm_id: invitation.firm_id,
      role: invitation.role,
      full_name: fullName,
      phone: phone || null,
      language_preference: languagePreference,
    })
    .eq("id", newUser.id);

  await supabaseAdminClient
    .from("firm_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password,
  });

  if (signInError) {
    return {
      success: true,
      requiresLogin: true,
      message: "Account created. Please sign in with your new password.",
      redirectTo: `/sign-in?email=${encodeURIComponent(invitation.email)}`,
    };
  }

  return {
    success: true,
    redirectTo: "/dashboard",
  };
}

