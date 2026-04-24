import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MessagesList } from "@/components/messages/messages-list";
import { MessageComposer } from "@/components/messages/message-composer";
import { MessageCircle } from "lucide-react";

export const metadata = {
  title: "Messages • Lawyer Diary",
};

export default async function MessagesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    redirect("/onboarding");
  }

  // Get team members for recipient selection
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("firm_id", profile.firm_id)
    .neq("role", "client")
    .neq("id", user.id)
    .order("full_name");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("firm_id", profile.firm_id)
    .order("full_name");

  // Get recent messages - messages where user is sender, recipient, or group messages
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id,
      sender_id,
      recipient_id,
      content,
      is_read,
      created_at,
      sender:profiles!messages_sender_id_fkey(id, full_name, role),
      recipient:profiles!messages_recipient_id_fkey(id, full_name, role)
    `)
    .eq("firm_id", profile.firm_id)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id},recipient_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="dark -mx-4 rounded-3xl bg-linear-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-6 lg:mx-0 lg:px-0">
      <div className="space-y-3 sm:space-y-4 lg:px-4">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-200">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight sm:text-lg">Messages</h1>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-300/80">
                Message team members and clients without leaving your dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-5">
              <div className="mb-3">
                <h2 className="text-base font-black tracking-tight text-slate-100 sm:text-lg">Inbox</h2>
                <p className="mt-0.5 text-xs text-slate-300/80">
                  Team message history and group announcements.
                </p>
              </div>
              <div className="flex min-h-0 flex-col overflow-hidden">
                <MessagesList messages={messages || []} currentUserId={user.id} firmId={profile.firm_id} />
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-5">
              <div className="mb-3">
                <h2 className="text-base font-black tracking-tight text-slate-100 sm:text-lg">Compose</h2>
                <p className="mt-0.5 text-xs text-slate-300/80">
                  Send to a team member, a client, or broadcast to your team.
                </p>
              </div>
              <MessageComposer
                teamMembers={teamMembers || []}
                clients={clients || []}
                currentUserId={user.id}
                firmId={profile.firm_id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
