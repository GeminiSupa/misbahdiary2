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

  const pathname = request.nextUrl.pathname;
  const isClientRoute = pathname.startsWith("/client/");
  const isLawyerRoute = pathname.startsWith("/lawyer/");

  // Search / DNS verification files in `public/` must be readable without a session.
  // Otherwise middleware redirects unauthenticated requests to /sign-in and Bing/Google cannot verify.
  const lowerPath = pathname.toLowerCase();
  if (
    lowerPath === "/bingsiteauth.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return response;
  }

  // Public routes that don't require authentication
  // NOTE: `/auth/callback` must be public or OAuth code exchange will be blocked by middleware.
  const publicRoutes = [
    "/blog",
    "/sign-in",
    "/sign-up",
    "/confirm",
    "/client-login",
    "/auth/callback",
    "/diagnostics",
    "/privacy",
    "/terms",
    "/api/webhooks",
  ];

  const isPublicRoute =
    pathname === "/" || // Landing page for SEO
    publicRoutes.some((route) => pathname.startsWith(route));

  // Resolve client mapping once for client/lawyer specific routes.
  let clientForUser: { id: string } | null = null;
  if (user && (isClientRoute || isLawyerRoute)) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("portal_enabled", true)
      .maybeSingle();
    clientForUser = client ?? null;
  }

  // Client routes: require authenticated, mapped client portal user.
  if (isClientRoute) {
    if (!user) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (!clientForUser) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Valid portal session: skip subscription checks (portal users are not firm subscribers).
    return response;
  }

  // Lawyer routes: block client users and send them to client dashboard.
  if (isLawyerRoute && user && clientForUser) {
    const clientDashboardUrl = new URL("/client/dashboard", request.url);
    return NextResponse.redirect(clientDashboardUrl);
  }

  // If not authenticated and trying to access protected non-API route, redirect to sign-in
  if (!user && !isPublicRoute && !pathname.startsWith("/api")) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated, check subscription for ALL app routes (excluding public + API)
  // Block access to everything except subscription, onboarding, and public routes when expired
  if (user && !isPublicRoute && !pathname.startsWith("/api")) {
    // Always allow access to subscription, onboarding, and user manual pages
    if (
      pathname.startsWith("/subscription") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/user-manual")
    ) {
      return response;
    }

    // Check subscription for ALL authenticated routes (not just specific ones)
    // This ensures complete blocking when trial/subscription expires
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.id)
      .maybeSingle();

    // Always allow /admin - admin pages do their own super-admin check
    if (pathname.startsWith("/admin")) {
      return response;
    }

    // If user has a firm, check subscription access
    if (profile?.firm_id) {
      try {
        // Super admins bypass subscription check (allow full access)
        const { isSuperAdmin } = await import("@/lib/server/access-control");
        if (await isSuperAdmin(user.id)) {
          return response;
        }

        const subscriptionCheck = await checkSubscriptionAccess(profile.firm_id, user.id);

        // STRICT BLOCKING: Completely block access if no active trial or subscription
        // This blocks ALL app functionality until they subscribe
        if (!subscriptionCheck.hasAccess) {
          const subscriptionUrl = new URL("/subscription", request.url);
          subscriptionUrl.searchParams.set("expired", "true");
          if (subscriptionCheck.message) {
            subscriptionUrl.searchParams.set("message", subscriptionCheck.message);
          }
          return NextResponse.redirect(subscriptionUrl);
        }
      } catch (error) {
        // On error, be strict: block access and redirect to subscription
        // This prevents users from accessing the app if there's a subscription check failure
        console.error("Subscription check error - blocking access:", error);
        const subscriptionUrl = new URL("/subscription", request.url);
        subscriptionUrl.searchParams.set("error", "subscription_check_failed");
        return NextResponse.redirect(subscriptionUrl);
      }
    }
    // If user doesn't have a firm_id yet, allow access (they'll be redirected to onboarding by the page itself)
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
