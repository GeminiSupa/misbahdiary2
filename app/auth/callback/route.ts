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
      
      // For popup flow, return error page that notifies parent
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Failed</title>
            <meta charset="utf-8">
          </head>
          <body>
            <script>
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ 
                  type: 'OAUTH_ERROR', 
                  message: ${JSON.stringify(error.message || "Failed to complete authentication. Please try again.")}
                }, window.location.origin);
                setTimeout(() => window.close(), 100);
              } else {
                window.location.href = '/sign-in?error=' + encodeURIComponent(${JSON.stringify(error.message || "Failed to complete authentication. Please try again.")});
              }
            </script>
            <p>Authentication failed. This window will close automatically.</p>
          </body>
        </html>
      `;
      
      const errorResponse = new NextResponse(errorHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
      
      // Copy cookies
      response.cookies.getAll().forEach((cookie) => {
        errorResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path || "/",
          domain: cookie.domain,
          maxAge: cookie.maxAge,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as "strict" | "lax" | "none" | undefined,
        });
      });
      
      return errorResponse;
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
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            try {
              // Notify parent window of success
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin);
                // Close popup after a short delay to ensure message is sent
                setTimeout(() => {
                  window.close();
                }, 100);
              } else {
                // If not in popup, redirect normally
                window.location.href = '/';
              }
            } catch (error) {
              console.error('Error in OAuth callback:', error);
              // Fallback: try to redirect
              if (window.opener) {
                window.close();
              } else {
                window.location.href = '/';
              }
            }
          </script>
          <p>Authentication successful. This window will close automatically.</p>
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


