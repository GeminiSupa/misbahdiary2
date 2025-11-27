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
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    redirect("/onboarding");
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("name")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, link, created_at, read_at, user_id")
    .eq("firm_id", profile.firm_id)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .is("read_at", null) // only unread for the bell
    .order("created_at", { ascending: false })
    .limit(20);

  const notificationSummaries =
    notifications?.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      createdAt: notification.created_at,
      readAt: notification.read_at,
    })) ?? [];

  return (
    <AppShell firmName={firm?.name} notifications={notificationSummaries}>
      {children}
    </AppShell>
  );
}
