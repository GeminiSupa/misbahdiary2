import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    redirectUrl.searchParams.set(
      "error",
      errorDescription || errorParam || "Authentication failed. Please try again."
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = await createSupabaseRouteHandlerClient(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    // If exchange fails, redirect to sign-in with error
    const redirectUrl = new URL("/sign-in", origin);
    redirectUrl.searchParams.set(
      "error",
      error.message || "Failed to complete authentication. Please try again."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Fallback redirect on error (no code, no error param)
  const redirectUrl = new URL("/sign-in", origin);
  redirectUrl.searchParams.set("error", "No authorization code received. Please try again.");
  return NextResponse.redirect(redirectUrl);
}


