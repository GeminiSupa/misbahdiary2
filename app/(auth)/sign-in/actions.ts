"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function initiateGoogleOAuth(): Promise<{ url: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  
  // Build redirect URL - must match Supabase dashboard configuration exactly
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";
  
  const redirectUrl = `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error("Server-side OAuth error:", error);
    return { error: error.message };
  }

  if (!data?.url) {
    return { error: "Failed to generate OAuth URL" };
  }

  return { url: data.url };
}
