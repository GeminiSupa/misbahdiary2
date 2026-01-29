import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

const getSupabaseConfig = () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Use placeholder values to allow build to complete
    // Runtime will handle missing env vars - Supabase calls will fail gracefully
    // and the app can show appropriate error messages
    console.warn("Supabase environment variables not configured. Using placeholder values.");
    return {
      url: "https://placeholder.supabase.co",
      key: "placeholder-key",
    };
  }

  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
};

/**
 * Create Supabase client for Server Components
 * Uses getAll() and setAll() pattern as recommended by @supabase/ssr
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const config = getSupabaseConfig();

  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Create Supabase client for Route Handlers
 * Uses getAll() and setAll() pattern as recommended by @supabase/ssr
 */
export async function createSupabaseRouteHandlerClient(
  request: Request,
  response: NextResponse,
) {
  const config = getSupabaseConfig();

  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return request.headers
          .get("cookie")
          ?.split(";")
          .map((cookie) => {
            const [name, ...rest] = cookie.trim().split("=");
            return { name, value: rest.join("=") };
          }) || [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

