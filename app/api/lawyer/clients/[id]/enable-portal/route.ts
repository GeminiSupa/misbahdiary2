import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getOrCreateAuthUser,
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

    // Existing auth model: a signed-in lawyer/staff must belong to a firm.
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

    // Lawyer can only enable portal for clients in their own firm.
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

    const normalizedEmail = normalizeEmail(client.email ?? "");
    if (!validatePortalEmail(normalizedEmail)) {
      return NextResponse.json(
        { message: "Client must have a valid email before enabling portal access." },
        { status: 400 },
      );
    }

    // Edge-case safety: do not allow ambiguous duplicate email mappings.
    const { data: duplicateClients, error: duplicateError } = await supabase
      .from("clients")
      .select("id, auth_user_id, portal_enabled")
      .neq("id", client.id)
      .ilike("email", normalizedEmail)
      .limit(5);

    if (duplicateError) {
      return NextResponse.json(
        { message: `Failed to validate duplicate emails: ${duplicateError.message}` },
        { status: 500 },
      );
    }

    const conflictingClient = (duplicateClients ?? []).find(
      (item) => Boolean(item.auth_user_id) || item.portal_enabled,
    );
    if (conflictingClient) {
      return NextResponse.json(
        {
          message:
            "This email is already linked to another client portal account. Resolve duplicate client emails first.",
        },
        { status: 409 },
      );
    }

    const portalAuthUser = await getOrCreateAuthUser(normalizedEmail);

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        auth_user_id: portalAuthUser.id,
        portal_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id)
      .eq("firm_id", profile.firm_id);

    if (updateError) {
      return NextResponse.json(
        { message: `Failed to enable client portal: ${updateError.message}` },
        { status: 500 },
      );
    }

    console.info("[client-portal] enabled", {
      clientId: client.id,
      authUserId: portalAuthUser.id,
      enabledBy: user.id,
    });

    // Send portal magic link with rate-limit protection.
    const linkResult = await sendClientPortalMagicLink({
      normalizedEmail,
      requestOrigin: request.nextUrl.origin,
      scopeKey: client.id,
    });

    if (!linkResult.ok) {
      if (typeof linkResult.retryAfterSeconds === "number") {
        return NextResponse.json(
          {
            success: true,
            clientId: client.id,
            authUserId: portalAuthUser.id,
            portalEnabled: true,
            emailSent: false,
            retryAfterSeconds: linkResult.retryAfterSeconds,
            message: linkResult.message,
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          message: "Portal enabled, but magic link email could not be sent.",
          details: linkResult.message,
        },
        { status: 502 },
      );
    }

    console.info("[client-portal] login-link-sent", {
      clientId: client.id,
      authUserId: portalAuthUser.id,
      sentBy: user.id,
    });

    return NextResponse.json({
      success: true,
      clientId: client.id,
      authUserId: portalAuthUser.id,
      portalEnabled: true,
      emailSent: true,
      message: "Client portal enabled and magic login link sent.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
