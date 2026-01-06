import { cookies } from "next/headers";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import type { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase environment variables are not configured.");
}

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // Server Components have a read-only cookie store.
        // Mutations happen in Route Handlers / Server Actions instead.
      },
      remove() {
        // See comment above.
      },
    },
  });
};

export const createSupabaseRouteHandlerClient = (
  request: Request,
  response: NextResponse,
) => {
  const requestCookies = parseCookieHeader(request.headers.get("cookie") ?? "");

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        // parseCookieHeader can return either a Map-like object with get()
        // or a plain record. Support both to avoid runtime type errors.
        const anyCookies = requestCookies as any;
        if (typeof anyCookies?.get === "function") {
          return anyCookies.get(name);
        }
        return anyCookies?.[name];
      },
      set(name, value, options) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name, options) {
        response.cookies.set({
          name,
          value: "",
          ...options,
          expires: new Date(0),
        });
      },
    },
  });
};

