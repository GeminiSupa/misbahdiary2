import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MessagesList } from "@/components/messages/messages-list";
import { MessageComposer } from "@/components/messages/message-composer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    .select("id, full_name, role, email")
    .eq("firm_id", profile.firm_id)
    .neq("role", "client")
    .neq("id", user.id)
    .order("full_name");

  // Get recent messages
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
    .limit(50);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-bold">Team Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate with your team members
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 flex-1 min-h-0">
        <div className="md:col-span-2 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Your team conversations</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <MessagesList
                messages={messages || []}
                currentUserId={user.id}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>Send a message to team members</CardDescription>
            </CardHeader>
            <CardContent>
              <MessageComposer
                teamMembers={teamMembers || []}
                currentUserId={user.id}
                firmId={profile.firm_id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
