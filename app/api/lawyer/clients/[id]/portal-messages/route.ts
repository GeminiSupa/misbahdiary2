import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendClientEmail, sendFirmEmailByPreference } from "@/lib/server/notification-email";

const MAX_LEN = 8000;

async function assertFirmClientAccess(clientId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const e = new Error("Unauthorized");
    (e as Error & { status?: number }).status = 401;
    throw e;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.firm_id || profile.role === "client") {
    const e = new Error("Forbidden");
    (e as Error & { status?: number }).status = 403;
    throw e;
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, firm_id")
    .eq("id", clientId)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (clientError || !client) {
    const e = new Error("Client not found.");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }

  return { supabase, user, firmId: profile.firm_id, client };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await context.params;
    const { supabase, client } = await assertFirmClientAccess(clientId);

    const lawyerProfileId = request.nextUrl.searchParams.get("lawyerProfileId");

    let query = supabase
      .from("client_lawyer_messages")
      .select("id, firm_id, client_id, lawyer_profile_id, sender_auth_user_id, content, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: true });

    if (lawyerProfileId) {
      query = query.eq("lawyer_profile_id", lawyerProfileId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ message: `Failed to load messages: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 401 || status === 403 || status === 404) {
      return NextResponse.json({ message: (error as Error).message }, { status });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await context.params;
    const { supabase, user, client } = await assertFirmClientAccess(clientId);

    const body = (await request.json().catch(() => ({}))) as {
      lawyerProfileId?: unknown;
      content?: unknown;
    };

    const lawyerProfileId = typeof body.lawyerProfileId === "string" ? body.lawyerProfileId.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!lawyerProfileId) {
      return NextResponse.json({ message: "lawyerProfileId (thread) is required." }, { status: 400 });
    }
    if (!content || content.length > MAX_LEN) {
      return NextResponse.json(
        { message: `Message must be 1–${MAX_LEN} characters.` },
        { status: 400 },
      );
    }

    const { data: threadLawyer, error: tlError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", lawyerProfileId)
      .eq("firm_id", client.firm_id)
      .maybeSingle();

    if (tlError || !threadLawyer || threadLawyer.role === "client") {
      return NextResponse.json({ message: "Invalid thread lawyer." }, { status: 400 });
    }

    const { error: insertError } = await supabase.from("client_lawyer_messages").insert({
      firm_id: client.firm_id,
      client_id: client.id,
      lawyer_profile_id: lawyerProfileId,
      sender_auth_user_id: user.id,
      content,
    });

    if (insertError) {
      return NextResponse.json({ message: `Failed to send: ${insertError.message}` }, { status: 500 });
    }

    // Email notifications
    // - Client: always (if they have email) for lawyer->client thread activity
    void sendClientEmail({
      clientId: client.id,
      subject: "New message from your lawyer",
      text: content.length > 600 ? `${content.slice(0, 600)}…` : content,
      linkPath: "/client/messages",
    });
    // - Firm members: announcements_updates (keeps it under a single preference bucket)
    void sendFirmEmailByPreference({
      firmId: client.firm_id,
      preference: "announcement_updates",
      subject: "Client portal message sent",
      text: `A message was sent to a client portal thread.\n\nClient ID: ${client.id}`,
      linkPath: `/clients/${client.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 401 || status === 403 || status === 404) {
      return NextResponse.json({ message: (error as Error).message }, { status });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
