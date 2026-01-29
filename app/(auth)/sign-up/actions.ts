"use server";

import { z } from "zod";
import { supabaseAdminClient } from "@/lib/supabase/admin";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  fullName: z.string().min(2, "Enter your full name"),
});

export async function signUpWithImmediateAccess(
  values: z.infer<typeof signUpSchema>,
): Promise<{ error?: string; success?: boolean }> {
  const parsed = signUpSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Please check your input and try again.",
    };
  }

  const { email, password, fullName } = parsed.data;

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      return { error: "A user with this email already exists. Please sign in instead." };
    }

    // Create user with email_confirm: true (no email confirmation required)
    const { data: newUser, error: createError } = await supabaseAdminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // Auto-confirm email for immediate access
      user_metadata: {
        full_name: fullName.trim(),
      },
    });

    if (createError || !newUser.user) {
      return {
        error: createError?.message || "Failed to create account. Please try again.",
      };
    }

    // Wait briefly for profile trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Success - user is created and email is confirmed
    // Client will sign in with password after this
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
    return { error: errorMessage };
  }
}
