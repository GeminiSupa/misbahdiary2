import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Intermediate redirect page to help with cookie persistence
 * This page receives the OAuth callback, sets cookies, then redirects
 */
export default async function OAuthRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_description?: string;
    next?: string;
    redirect?: string;
  }>;
}) {
  const { code, error: errorParam, error_description, next, redirect: redirectTo } = await searchParams;
  const successRedirect = next || redirectTo || "/dashboard";

  // Handle OAuth errors
  if (errorParam) {
    const errorMessage = error_description || errorParam || "Authentication failed";
    redirect(`/sign-in?error=${encodeURIComponent(errorMessage)}`);
  }

  // If no code, redirect to sign-in
  if (!code) {
    redirect("/sign-in?error=" + encodeURIComponent("No authorization code received"));
  }

  // Exchange code for session
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error in redirect page:", error);
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  if (!data?.session) {
    redirect("/sign-in?error=" + encodeURIComponent("Failed to create session"));
  }

  redirect(successRedirect);
}
