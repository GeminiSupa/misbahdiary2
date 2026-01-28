"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function initiateGoogleOAuth(): Promise<{ url: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  
  const redirectUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.concat("/auth/callback") ??
    process.env.NEXT_PUBLIC_VERCEL_URL?.concat("/auth/callback") ??
    "http://localhost:3000/auth/callback";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
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
