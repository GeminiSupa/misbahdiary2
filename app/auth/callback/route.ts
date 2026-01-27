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

  // Create response - we'll set the redirect after session is created
  let response = NextResponse.next();

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

    console.log("OAuth callback successful");
    
    // For popup flow, return an HTML page that closes the popup and notifies parent
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <script>
            // Close popup and notify parent window
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin);
              window.close();
            } else {
              // If not in popup, redirect normally
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `;
    
    // Create response with cookies and HTML content
    const finalResponse = new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
    
    // Copy all cookies from response to finalResponse
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || "/",
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite as "strict" | "lax" | "none" | undefined,
      });
    });
    
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


