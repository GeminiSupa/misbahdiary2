import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
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
    .select("firm_id, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isSuperAdmin = (profile as { is_super_admin?: boolean } | null)?.is_super_admin === true;

  if (!profile?.firm_id && !isSuperAdmin) {
    redirect("/onboarding");
  }

  if (isSuperAdmin) {
    redirect("/admin");
  }

  redirect("/dashboard");
}
