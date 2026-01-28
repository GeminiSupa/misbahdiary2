import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Log for debugging
  console.log("🏠 Home page - Auth check:", {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    error: error?.message,
  });

  if (error || !user) {
    console.log("🏠 Home page - Redirecting to sign-in (no user)");
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  console.log("🏠 Home page - Profile check:", {
    hasProfile: !!profile,
    firmId: profile?.firm_id,
  });

  if (!profile?.firm_id) {
    console.log("🏠 Home page - Redirecting to onboarding (no firm_id)");
    redirect("/onboarding");
  }

  console.log("🏠 Home page - Redirecting to dashboard");
  redirect("/dashboard");
}
