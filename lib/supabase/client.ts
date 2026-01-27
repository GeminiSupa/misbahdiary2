"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | undefined;

export const getBrowserClient = (): SupabaseClient<Database> => {
  // Only create client on client side
  if (typeof window === "undefined") {
    // Return a placeholder client that will fail gracefully
    // This should never happen if called correctly, but prevents crashes during SSR
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    
    const errorMsg = `Supabase environment variables are not configured. Missing: ${missingVars.join(", ")}. Please check your environment variables.`;
    console.error(errorMsg);
    
    // Create a client with invalid URL so errors are clear
    browserClient = createBrowserClient<Database>(
      supabaseUrl || "",
      supabaseAnonKey || ""
    );
    return browserClient;
  }

  // createBrowserClient from @supabase/ssr automatically handles cookies for PKCE
  // It uses document.cookie internally, so we don't need to configure it manually
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return browserClient;
};

// Alias for convenience
export const createSupabaseClient = getBrowserClient;
