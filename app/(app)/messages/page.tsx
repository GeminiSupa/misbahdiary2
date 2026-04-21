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
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Hero Header - SAP Fiori Horizon Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Team Messages</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Communicate with your team members and stay connected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="sap-card-success">
            <div className="sap-card-body space-y-4">
              <div className="sap-card-header">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground sm:text-lg">Messages</h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Your team conversations and message history.
                  </p>
                </div>
              </div>
              <div className="flex flex-col min-h-0 overflow-hidden">
                <MessagesList
                  messages={messages || []}
                  currentUserId={user.id}
                  firmId={profile.firm_id}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="sap-card-success">
            <div className="sap-card-body space-y-4">
              <div className="sap-card-header">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground sm:text-lg">Send Message</h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Send a message to team members.
                  </p>
                </div>
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
