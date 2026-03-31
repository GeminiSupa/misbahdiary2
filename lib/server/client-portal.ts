import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { User } from "@supabase/supabase-js";

export type ClientRole = "client" | "lawyer_admin";

/**
 * Returns the enabled client record mapped to the auth user.
 * If no enabled mapping exists, returns null.
 */
export async function getClientFromUser(
  userId: string,
): Promise<Tables<"clients"> | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_user_id", userId)
    .eq("portal_enabled", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve client from user: ${error.message}`);
  }

  return data ?? null;
}

/**
 * Role detection for shared auth:
 * - user mapped in clients.auth_user_id + portal_enabled => "client"
 * - otherwise keep existing app role model => "lawyer_admin"
 */
export async function detectUserRole(userId: string): Promise<ClientRole> {
  const client = await getClientFromUser(userId);
  return client ? "client" : "lawyer_admin";
}

/**
 * Central request-time guard for client APIs.
 * Validates user session and active client mapping on every request.
 */
export async function requireClientPortalAccess(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
  client: Tables<"clients">;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const unauthorizedError = new Error("Unauthorized");
    (unauthorizedError as Error & { status?: number }).status = 401;
    throw unauthorizedError;
  }

  const client = await getClientFromUser(user.id);
  if (!client) {
    const forbiddenError = new Error("Forbidden");
    (forbiddenError as Error & { status?: number }).status = 403;
    throw forbiddenError;
  }

  return { supabase, user, client };
}
