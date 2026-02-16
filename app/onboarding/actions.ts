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

  // Calculate trial dates (30 days from now)
  const trialStartedAt = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  // Get the default subscription plan (Professional Plan)
  // Note: There might be multiple "Professional Plan" entries, so we get the first one
  const { data: defaultPlans, error: planError } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", "Professional Plan")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);
  
  const defaultPlan = defaultPlans && defaultPlans.length > 0 ? defaultPlans[0] : null;

  if (planError) {
    console.error("Error fetching default subscription plan during onboarding:", planError);
    // Continue with null plan_id - it will be set by migration or can be fetched later
  }

  if (!defaultPlan) {
    console.warn("No default subscription plan found during onboarding. This might be an RLS policy issue.");
  }

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

  // Send welcome email via MailerSend (non-blocking; do not fail onboarding if email fails)
  const { sendWelcomeEmail } = await import("@/lib/email/mailersend");
  sendWelcomeEmail(contactEmail, fullName).then((result) => {
    if (!result.success && process.env.NODE_ENV === "development") {
      console.warn("Welcome email not sent:", result.error);
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/onboarding");

  return { success: true };
}

