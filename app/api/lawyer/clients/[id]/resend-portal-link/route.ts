import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeEmail,
  sendClientPortalMagicLink,
  validatePortalEmail,
} from "@/lib/server/client-portal-auth";

export async function POST(
  request: NextRequest,
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

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, firm_id, email, portal_enabled, auth_user_id")
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
        { message: "Portal must be enabled before sending a login link." },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeEmail(client.email ?? "");
    if (!validatePortalEmail(normalizedEmail)) {
      return NextResponse.json(
        { message: "Client must have a valid email to receive login links." },
        { status: 400 },
      );
    }

    const linkResult = await sendClientPortalMagicLink({
      normalizedEmail,
      requestOrigin: request.nextUrl.origin,
      scopeKey: client.id,
    });

    if (!linkResult.ok) {
      if (typeof linkResult.retryAfterSeconds === "number") {
        return NextResponse.json(
          {
            message: linkResult.message,
            retryAfterSeconds: linkResult.retryAfterSeconds,
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { message: "Could not send login link.", details: linkResult.message },
        { status: 502 },
      );
    }

    console.info("[client-portal] login-link-resent", {
      clientId: client.id,
      authUserId: client.auth_user_id,
      sentBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Login link sent successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
