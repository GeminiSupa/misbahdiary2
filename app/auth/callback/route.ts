import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const state = requestUrl.searchParams.get("state");

  // Log all incoming parameters for debugging
  console.log("🔔 OAuth Callback received:", {
    hasCode: !!code,
    hasError: !!errorParam,
    error: errorParam,
    errorDescription,
    hasState: !!state,
    origin: requestUrl.origin,
    pathname: requestUrl.pathname,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
  });

  // Check for OAuth provider errors (e.g., user denied access)
  if (errorParam) {
    console.error("❌ OAuth provider error:", {
      error: errorParam,
      description: errorDescription,
      fullUrl: requestUrl.toString(),
    });
    const redirectUrl = new URL("/sign-in", requestUrl.origin);
    redirectUrl.searchParams.set(
      "error",
      errorDescription || errorParam || "Authentication failed. Please try again."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // If no code, redirect to sign-in with error
  if (!code) {
    console.error("❌ No authorization code received in OAuth callback", {
      url: requestUrl.toString(),
      searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
    });
    const redirectUrl = new URL("/sign-in", requestUrl.origin);
    redirectUrl.searchParams.set("error", "No authorization code received. Please try again.");
    return NextResponse.redirect(redirectUrl);
  }

  // Extract the site URL from the state parameter if available
  // This ensures we redirect to the correct origin even if request comes from Supabase
  let redirectOrigin = requestUrl.origin;
  
  try {
    const stateParam = requestUrl.searchParams.get("state");
    if (stateParam) {
      // Decode JWT state to get site_url
      const statePayload = JSON.parse(
        Buffer.from(stateParam.split(".")[1], "base64").toString()
      );
      if (statePayload.site_url) {
        redirectOrigin = new URL(statePayload.site_url).origin;
        console.log("🔍 Using site_url from state:", redirectOrigin);
      }
    }
  } catch (e) {
    // If state parsing fails, use request origin (fallback)
    console.log("⚠️ Could not parse state, using request origin:", redirectOrigin);
  }

  // Create redirect response - use the correct origin
  const homeUrl = new URL("/", redirectOrigin);
  let response = NextResponse.redirect(homeUrl);

  try {
    // CRITICAL: Use createSupabaseRouteHandlerClient which reads cookies
    // The PKCE code verifier must be in cookies (set by client-side OAuth initiation)
    
    // Debug: Log all cookies received
    const cookieHeader = request.headers.get("cookie") || "";
    const allCookies = cookieHeader.split(";").map(c => c.trim());
    console.log("🍪 All cookies received:", {
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.split("=")[0]),
      hasAuthCookie: cookieHeader.includes("auth-token"),
      hasCodeVerifier: cookieHeader.includes("code-verifier"),
    });
    
    // Check for PKCE code verifier cookie specifically
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    const codeVerifierCookieName = projectRef ? `sb-${projectRef}-auth-token-code-verifier` : "auth-token-code-verifier";
    const hasCodeVerifier = cookieHeader.includes(codeVerifierCookieName);
    console.log("🔐 PKCE Code Verifier Check:", {
      projectRef,
      codeVerifierCookieName,
      hasCodeVerifier,
      cookieHeader: cookieHeader.substring(0, 200) + "...", // First 200 chars
    });
    
    const supabase = createSupabaseRouteHandlerClient(request, response);
    
    console.log("🔐 Attempting to exchange code for session...");
    console.log("📋 Code received:", code?.substring(0, 20) + "...");
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("❌ Error exchanging code for session:", {
        message: error.message,
        status: error.status,
        name: error.name,
        code: code?.substring(0, 20) + "...",
        fullError: error,
        requestUrl: requestUrl.toString(),
      });
      
      // Log specific error types for better debugging
      if (error.message.includes("PKCE")) {
        console.error("🔍 PKCE Error - This usually means:");
        console.error("   - Cookies not being set properly");
        console.error("   - OAuth flow initiated in different browser/device");
        console.error("   - Storage was cleared during OAuth flow");
      }
      if (error.message.includes("redirect_uri")) {
        console.error("🔍 Redirect URI Error - This usually means:");
        console.error("   - Redirect URL mismatch in Supabase settings");
        console.error("   - Redirect URL mismatch in Google Cloud Console");
      }
      
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


