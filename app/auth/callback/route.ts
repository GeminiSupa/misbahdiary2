import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  
  // Default to home page, which will handle routing to dashboard or onboarding
  const next = requestUrl.searchParams.get("next") ?? "/";
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  if (!code) {
    return response;
  }

  const supabase = createSupabaseRouteHandlerClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirectUrl = new URL("/sign-in", requestUrl.origin);
    redirectUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  // After successful OAuth, redirect to home page
  // The home page (app/page.tsx) will check if user has firm_id
  // and redirect to /onboarding if needed, or /dashboard if they have a firm
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}


