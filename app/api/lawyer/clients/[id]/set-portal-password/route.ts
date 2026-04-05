import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canSetClientPortalCredentials } from "@/lib/server/access-control";
import { portalPasswordSchema, updateAuthUserPortalPassword } from "@/lib/server/client-portal-auth";

type Body = { password?: unknown };

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await context.params;
    if (!clientId) {
      return NextResponse.json({ message: "Client ID is required." }, { status: 400 });
    }

    const raw = (await request.json().catch(() => ({}))) as Body;
    const passwordRaw = typeof raw.password === "string" ? raw.password.trim() : "";
    if (!passwordRaw) {
      return NextResponse.json({ message: "Password is required." }, { status: 400 });
    }

    const parsed = portalPasswordSchema.safeParse(passwordRaw);
    if (!parsed.success) {
      const msg = parsed.error.flatten().formErrors[0] ?? "Invalid password.";
      return NextResponse.json({ message: msg }, { status: 400 });
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
      return NextResponse.json({ message: "You must belong to a firm." }, { status: 403 });
    }

    const allowed = await canSetClientPortalCredentials(user.id, profile.firm_id);
    if (!allowed) {
      return NextResponse.json(
        { message: "You do not have permission to set a client portal password for this firm." },
        { status: 403 },
      );
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, firm_id, email, auth_user_id, portal_enabled")
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

    if (!client.portal_enabled || !client.auth_user_id) {
      return NextResponse.json(
        { message: "Enable the client portal before setting a password." },
        { status: 400 },
      );
    }

    await updateAuthUserPortalPassword(client.auth_user_id, passwordRaw);

    console.info("[client-portal] password-updated", {
      clientId: client.id,
      authUserId: client.auth_user_id,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Portal password updated. Share the new password securely with the client.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
