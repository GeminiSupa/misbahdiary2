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

  const { firmName, contactEmail, contactPhone, fullName } = parsed.data;

  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .insert({
      name: firmName,
      contact_email: contactEmail,
      contact_phone: contactPhone ? contactPhone : null,
      locale: "en-PK",
      timezone: "Asia/Karachi",
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (firmError) {
    return { message: `Could not create firm: ${firmError.message}` };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        firm_id: firm.id,
        full_name: fullName,
        role: "principal_partner",
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

