import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Super admins skip onboarding (can access app without a firm)
  if (!profile?.firm_id && !isSuperAdmin) {
    redirect("/onboarding");
  }

  const firmId = profile?.firm_id;
  const { data: firm } = firmId
    ? await supabase.from("firms").select("name").eq("id", firmId).maybeSingle()
    : { data: null };

  const notificationsResult = firmId
    ? await supabase
        .from("notifications")
        .select("id, title, message, link, created_at, read_at, user_id")
        .eq("firm_id", firmId)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: null };

  const notifications = notificationsResult.data ?? [];
  const notificationSummaries = notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    createdAt: notification.created_at,
    readAt: notification.read_at,
  }));

  return (
    <AppShell firmName={firm?.name} notifications={notificationSummaries}>
      {children}
    </AppShell>
  );
}
