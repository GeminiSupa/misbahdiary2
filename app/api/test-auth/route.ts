import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Test endpoint to check auth state
 * Access at: /api/test-auth
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    const { data: session } = await supabase.auth.getSession();
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
      } : null,
      session: session?.session ? {
        expiresAt: session.session.expires_at,
        accessToken: session.session.access_token?.substring(0, 20) + "...",
      } : null,
      error: error?.message || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
