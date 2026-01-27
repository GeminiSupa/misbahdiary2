import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Check for OAuth provider errors (e.g., user denied access)
  if (errorParam) {
    console.error("OAuth error:", errorParam, errorDescription);
    const redirectUrl = new URL("/sign-in", requestUrl.origin);
    redirectUrl.searchParams.set(
      "error",
      errorDescription || errorParam || "Authentication failed. Please try again."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // If no code, redirect to sign-in with error
  if (!code) {
    console.error("No authorization code received in OAuth callback");
    const redirectUrl = new URL("/sign-in", requestUrl.origin);
    redirectUrl.searchParams.set("error", "No authorization code received. Please try again.");
    return NextResponse.redirect(redirectUrl);
  }

  // Create response for redirect
  const response = NextResponse.redirect(new URL("/", requestUrl.origin));

  try {
    const supabase = createSupabaseRouteHandlerClient(request, response);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", {
        message: error.message,
        status: error.status,
        name: error.name,
        code: code?.substring(0, 20) + "...",
      });
      const redirectUrl = new URL("/sign-in", requestUrl.origin);
      redirectUrl.searchParams.set("error", error.message || "Failed to complete authentication. Please try again.");
      return NextResponse.redirect(redirectUrl);
    }

    if (!data?.session) {
      console.error("No session created after code exchange:", { data });
      const redirectUrl = new URL("/sign-in", requestUrl.origin);
      redirectUrl.searchParams.set("error", "Failed to create session. Please try again.");
      return NextResponse.redirect(redirectUrl);
    }

    console.log("OAuth callback successful, redirecting to home page");
    // After successful OAuth, redirect to home page
    // The home page (app/page.tsx) will check if user has firm_id
    // and redirect to /onboarding if needed, or /dashboard if they have a firm
    return response;
  } catch (err) {
    console.error("Unexpected error in OAuth callback:", {
      error: err,
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    const redirectUrl = new URL("/sign-in", requestUrl.origin);
    redirectUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
    );
    return NextResponse.redirect(redirectUrl);
  }
}


