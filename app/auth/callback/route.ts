import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { getClientFromUser } from "@/lib/server/client-portal";
import { NextResponse } from "next/server";

function getAuthErrorMessage(errorParam: string | null, errorDescription: string | null): string {
  const source = (errorDescription || errorParam || "").toLowerCase();
  if (source.includes("expired")) {
    return "Your login link has expired. Please request a new magic link.";
  }
  if (source.includes("invalid") || source.includes("otp")) {
    return "This login link is invalid or already used. Please request a new magic link.";
  }
  return errorDescription || errorParam || "Authentication failed. Please try again.";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  // if "next" param exists → redirect there after login
  const next = searchParams.get("next") ?? "/";

  // Check for OAuth provider errors (e.g., user denied access)
  if (errorParam) {
    const redirectUrl = new URL("/sign-in", origin);
    redirectUrl.searchParams.set("error", getAuthErrorMessage(errorParam, errorDescription));
    redirectUrl.searchParams.set("redirect", "/client/dashboard");
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = await createSupabaseRouteHandlerClient(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Example post-login role check:
      // shared auth user => map to enabled client portal account when available.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const client = await getClientFromUser(user.id);
        if (client) {
          console.info("[client-portal] login-success", {
            clientId: client.id,
            authUserId: user.id,
          });
        }
      }
      return response;
    }

    // If exchange fails, redirect to sign-in with error
    const redirectUrl = new URL("/sign-in", origin);
    redirectUrl.searchParams.set("error", getAuthErrorMessage("exchange_failed", error.message));
    redirectUrl.searchParams.set("redirect", "/client/dashboard");
    return NextResponse.redirect(redirectUrl);
  }

  // Fallback redirect on error (no code, no error param)
  const redirectUrl = new URL("/sign-in", origin);
  redirectUrl.searchParams.set("error", "No authorization code received. Please try again.");
  return NextResponse.redirect(redirectUrl);
}


