import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canSetClientPortalCredentials } from "@/lib/server/access-control";
import {
  getOrCreateAuthUserWithOptionalPassword,
  normalizeEmail,
  portalPasswordSchema,
  sendClientPortalMagicLink,
  validatePortalEmail,
} from "@/lib/server/client-portal-auth";

type EnablePortalBody = {
  password?: unknown;
  sendMagicLink?: unknown;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await context.params;
    if (!clientId) {
      return NextResponse.json({ message: "Client ID is required." }, { status: 400 });
    }

    const rawBody = (await request.json().catch(() => ({}))) as EnablePortalBody;
    const passwordRaw = typeof rawBody.password === "string" ? rawBody.password : "";
    const passwordTrimmed = passwordRaw.trim();
    const wantsPassword = passwordTrimmed.length > 0;

    if (wantsPassword) {
      const parsed = portalPasswordSchema.safeParse(passwordTrimmed);
      if (!parsed.success) {
        const msg = parsed.error.flatten().formErrors[0] ?? "Invalid password.";
        return NextResponse.json({ message: msg }, { status: 400 });
      }
    }

    /** Opt-in: Resend proxy email. Without this, a portal password is required. */
    const sendMagicLink = rawBody.sendMagicLink === true;

    if (!sendMagicLink && !wantsPassword) {
      return NextResponse.json(
        {
          message:
            "Set a portal password for the client, or pass sendMagicLink: true to send a login email instead.",
        },
        { status: 400 },
      );
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

    if (wantsPassword) {
      const allowed = await canSetClientPortalCredentials(user.id, profile.firm_id);
      if (!allowed) {
        return NextResponse.json(
          { message: "You do not have permission to set a client portal password for this firm." },
          { status: 403 },
        );
      }
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

    const normalizedEmail = normalizeEmail(client.email ?? "");
    if (!validatePortalEmail(normalizedEmail)) {
      return NextResponse.json(
        { message: "Client must have a valid email before enabling portal access." },
        { status: 400 },
      );
    }

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

    const portalAuthUser = await getOrCreateAuthUserWithOptionalPassword(
      normalizedEmail,
      wantsPassword ? passwordTrimmed : null,
    );

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
      passwordSet: wantsPassword,
      sendMagicLink,
    });

    let responseMessage = "Client portal enabled.";
    if (sendMagicLink) {
      responseMessage = "Client portal enabled. Login link email is being sent.";
    } else if (wantsPassword) {
      responseMessage =
        "Client portal enabled with password. Share credentials securely with the client (no login email was sent).";
    }

    const response = NextResponse.json({
      success: true,
      clientId: client.id,
      authUserId: portalAuthUser.id,
      portalEnabled: true,
      message: responseMessage,
    });

    if (sendMagicLink) {
      void sendClientPortalMagicLink({
        normalizedEmail,
        requestOrigin: request.nextUrl.origin,
        scopeKey: client.id,
      })
        .then((linkResult) => {
          if (!linkResult.ok) {
            console.error("[client-portal] email send failed:", linkResult.message);
            return;
          }
          console.info("[client-portal] login-link-sent", {
            clientId: client.id,
            authUserId: portalAuthUser.id,
            sentBy: user.id,
          });
        })
        .catch((err) => {
          console.error("[client-portal] email send failed", err);
        });
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unable to")) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
