"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation/onboarding";
import type { OnboardingSchema } from "@/lib/validation/onboarding";

export type OnboardingPayload = OnboardingSchema;

type ActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function completeOnboarding(
  values: OnboardingSchema,
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const parsed = onboardingSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { firmName, contactEmail, contactPhone, fullName, role } = parsed.data;

  // Calculate trial dates (15 days from now)
  const trialStartedAt = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 15);

  // Get the default subscription plan (Professional Plan)
  const { data: defaultPlan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", "Professional Plan")
    .eq("is_active", true)
    .maybeSingle();

  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .insert({
      name: firmName,
      contact_email: contactEmail,
      contact_phone: contactPhone ? contactPhone : null,
      locale: "en-PK",
      timezone: "Asia/Karachi",
      owner_id: user.id,
      subscription_status: "trial",
      subscription_plan_id: defaultPlan?.id || null,
      trial_started_at: trialStartedAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .select("id")
    .single();

  if (firmError) {
    return { message: `Could not create firm: ${firmError.message}` };
  }

  // Log trial start in subscription history
  const { error: historyError } = await supabase
    .from("subscription_history")
    .insert({
      firm_id: firm.id,
      subscription_plan_id: defaultPlan?.id || null,
      status: "trial_started",
      event_data: {
        trial_started_at: trialStartedAt.toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
      },
    });
    
  if (historyError) {
    console.error("Failed to log trial start:", historyError);
    // Don't fail the onboarding if history logging fails
  }

  // Firm Owner should automatically be assigned principal_partner role
  // (They are the firm owner, so they must have principal_partner permissions)
  const userRole = "principal_partner";

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        firm_id: firm.id,
        full_name: fullName,
        role: userRole,
        phone: contactPhone ? contactPhone : null,
      },
      { onConflict: "id" },
    );

  if (profileError) {
    return { message: `Profile update failed: ${profileError.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/onboarding");

  return { success: true };
}

