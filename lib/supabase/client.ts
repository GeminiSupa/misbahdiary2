"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | undefined;

export const getBrowserClient = (): SupabaseClient<Database> => {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    
    const errorMsg = `Supabase environment variables are not configured. Missing: ${missingVars.join(", ")}. Please check your environment variables.`;
    console.error(errorMsg);
    
    // In browser, we need to create a client that will fail with a clear error
    // Create a client with invalid URL so errors are clear
    browserClient = createBrowserClient<Database>(
      supabaseUrl || "",
      supabaseAnonKey || ""
    );
    return browserClient;
  }

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return browserClient;
};

