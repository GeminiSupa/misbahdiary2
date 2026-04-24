import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export default async function OnboardingPage() {
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
    .select("firm_id, full_name, role, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.firm_id) {
    redirect("/dashboard");
  }

  return (
    <div className="sap-shell flex min-h-screen items-center justify-center">
      <div className="w-full max-w-2xl px-4 py-10">
        <div className="sap-card">
          <div className="sap-card-body">
            <OnboardingForm
              defaultValues={{
                contactEmail: user.email ?? "",
                fullName: profile?.full_name ?? "",
                contactPhone: profile?.phone ?? "",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

