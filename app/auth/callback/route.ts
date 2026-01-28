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

  // Try multiple approaches to ensure cookies are set properly
  // Approach 1: Create redirect response first, then set cookies
  const homeUrl = new URL("/", requestUrl.origin);
  let response = NextResponse.redirect(homeUrl);

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

    console.log("✅ OAuth callback successful! Session created:", {
      userId: data.session.user.id,
      email: data.session.user.email,
      expiresAt: data.session.expires_at,
    });
    
    // Ensure cookies are properly set by recreating response with cookies
    const finalResponse = NextResponse.redirect(homeUrl, {
      status: 302,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-OAuth-Success": "true",
      },
    });
    
    // Copy all cookies from the Supabase client response
    const cookiesSet: string[] = [];
    response.cookies.getAll().forEach((cookie) => {
      cookiesSet.push(cookie.name);
      finalResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || "/",
        domain: cookie.domain,
        maxAge: cookie.maxAge || 60 * 60 * 24 * 7, // 7 days default
        httpOnly: cookie.httpOnly ?? true,
        secure: cookie.secure ?? true,
        sameSite: (cookie.sameSite as "strict" | "lax" | "none") || "lax",
      });
    });
    
    console.log("🍪 Cookies set in response:", cookiesSet);
    
    // The home page (app/page.tsx) will check if user has firm_id
    // and redirect to /onboarding if needed, or /dashboard if they have a firm
    return finalResponse;
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


