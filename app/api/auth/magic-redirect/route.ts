import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function expiredRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/client-login?error=link-expired", request.url));
}

/**
 * Consumes a one-time proxy token and redirects to the real Supabase magic-link URL.
 * Invoked when the user clicks "Continue" on /client-login (not from the email body alone).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || !UUID_RE.test(token)) {
    return expiredRedirect(request);
  }

  const { data: row, error } = await supabaseAdminClient
    .from("client_portal_magic_link_tokens")
    .select("id, supabase_action_link, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !row) {
    return expiredRedirect(request);
  }

  if (row.used_at) {
    return expiredRedirect(request);
  }

  if (new Date(row.expires_at) < new Date()) {
    return expiredRedirect(request);
  }

  const { data: updated, error: updateError } = await supabaseAdminClient
    .from("client_portal_magic_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return expiredRedirect(request);
  }

  return NextResponse.redirect(row.supabase_action_link);
}
