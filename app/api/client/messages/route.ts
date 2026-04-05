import { NextRequest, NextResponse } from "next/server";
import { requireClientPortalAccess } from "@/lib/server/client-portal";

const MAX_LEN = 8000;

export async function GET(request: NextRequest) {
  try {
    const { supabase, client, user } = await requireClientPortalAccess();

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

    return NextResponse.json({
      data: data ?? [],
      currentUserId: user.id,
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 401 || status === 403) {
      return NextResponse.json({ message: status === 401 ? "Unauthorized." : "Forbidden." }, { status });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, client, user } = await requireClientPortalAccess();

    const body = (await request.json().catch(() => ({}))) as {
      lawyerProfileId?: unknown;
      content?: unknown;
    };

    const lawyerProfileId = typeof body.lawyerProfileId === "string" ? body.lawyerProfileId.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!lawyerProfileId) {
      return NextResponse.json({ message: "lawyerProfileId is required." }, { status: 400 });
    }
    if (!content || content.length > MAX_LEN) {
      return NextResponse.json(
        { message: `Message must be 1–${MAX_LEN} characters.` },
        { status: 400 },
      );
    }

    const { data: lawyer, error: lawyerError } = await supabase
      .from("profiles")
      .select("id, firm_id, role")
      .eq("id", lawyerProfileId)
      .eq("firm_id", client.firm_id)
      .maybeSingle();

    if (lawyerError || !lawyer || lawyer.role === "client") {
      return NextResponse.json({ message: "Invalid lawyer selected." }, { status: 400 });
    }

    const { data: row, error: insertError } = await supabase
      .from("client_lawyer_messages")
      .insert({
        firm_id: client.firm_id,
        client_id: client.id,
        lawyer_profile_id: lawyerProfileId,
        sender_auth_user_id: user.id,
        content,
      })
      .select("id, firm_id, client_id, lawyer_profile_id, sender_auth_user_id, content, created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ message: `Failed to send: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 401 || status === 403) {
      return NextResponse.json({ message: status === 401 ? "Unauthorized." : "Forbidden." }, { status });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
