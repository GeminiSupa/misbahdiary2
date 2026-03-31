import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await context.params;
    if (!clientId) {
      return NextResponse.json({ message: "Client ID is required." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.firm_id) {
      return NextResponse.json(
        { message: "You must belong to a firm to manage client portal access." },
        { status: 403 },
      );
    }

    // Restrict operation to clients owned by the requester's firm.
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, firm_id, portal_enabled")
      .eq("id", clientId)
      .eq("firm_id", profile.firm_id)
      .maybeSingle();

    if (clientError) {
      return NextResponse.json(
        { message: `Failed to load client: ${clientError.message}` },
        { status: 500 },
      );
    }

    if (!client) {
      return NextResponse.json({ message: "Client not found." }, { status: 404 });
    }

    // Idempotent: disabling an already-disabled client remains successful.
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        portal_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id)
      .eq("firm_id", profile.firm_id);

    if (updateError) {
      return NextResponse.json(
        { message: `Failed to disable client portal: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      clientId: client.id,
      portalEnabled: false,
      message: "Client portal disabled.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
