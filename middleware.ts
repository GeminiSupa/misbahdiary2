import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkSubscriptionAccess } from "@/lib/server/subscription-check";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  // Public routes that don't require authentication
  // NOTE: `/auth/callback` must be public or OAuth code exchange will be blocked by middleware.
  const publicRoutes = [
    "/sign-in",
    "/sign-up",
    "/confirm",
    "/auth/callback",
    "/diagnostics",
    "/privacy",
    "/terms",
    "/api/webhooks",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // If not authenticated and trying to access protected route, redirect to sign-in
  if (!user && !isPublicRoute && !request.nextUrl.pathname.startsWith("/api")) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated, check subscription for protected app routes
  // Only block access to main app routes (dashboard, cases, calendar, billing, clients, settings)
  // Always allow navigation to subscription and onboarding pages
  if (user && !isPublicRoute && !request.nextUrl.pathname.startsWith("/api")) {
    // Always allow access to subscription and onboarding pages
    if (
      request.nextUrl.pathname.startsWith("/subscription") ||
      request.nextUrl.pathname.startsWith("/onboarding")
    ) {
      return response;
    }

    const protectedRoutes = [
      "/dashboard",
      "/cases",
      "/calendar",
      "/billing",
      "/clients",
      "/settings",
    ];

    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route),
    );

    // Only check subscription for protected routes
    if (isProtectedRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", user.id)
        .maybeSingle();

      // If user has a firm, check subscription access
      if (profile?.firm_id) {
        try {
          const subscriptionCheck = await checkSubscriptionAccess(profile.firm_id);

          // Only redirect if subscription is explicitly expired
          // This means: trial expired OR subscription expired
          // We check status === "expired" because the check function sets this when trial/subscription expires
          if (!subscriptionCheck.hasAccess && subscriptionCheck.status === "expired") {
            const subscriptionUrl = new URL("/subscription", request.url);
            return NextResponse.redirect(subscriptionUrl);
          }
          // Allow access in all other cases:
          // - Trial active (hasAccess = true)
          // - Subscription active (hasAccess = true)
          // - System not configured (hasAccess = true, status = "trial")
          // - Any errors or uncertainty (allow access)
        } catch (error) {
          // If subscription check fails, allow access (don't block navigation)
          // This prevents blocking users if there's a database error
          console.error("Subscription check error:", error);
        }
      }
      // If user doesn't have a firm_id yet, allow access (they'll be redirected to onboarding by the page itself)
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
