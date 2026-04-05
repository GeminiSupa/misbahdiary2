import { NextResponse } from "next/server";
import { requireClientPortalAccess } from "@/lib/server/client-portal";
import { fetchPortalLegacyCaseIds, fetchPortalMatterIds } from "@/lib/server/client-portal-matters";

export async function GET() {
  try {
    const { supabase, client } = await requireClientPortalAccess();

    const [matterIds, legacyCaseIds] = await Promise.all([
      fetchPortalMatterIds(supabase, client.id),
      fetchPortalLegacyCaseIds(supabase, client.id),
    ]);

    if (matterIds.length === 0 && legacyCaseIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const orParts: string[] = [];
    if (matterIds.length > 0) {
      orParts.push(`matter_id.in.(${matterIds.join(",")})`);
    }
    if (legacyCaseIds.length > 0) {
      orParts.push(`case_id.in.(${legacyCaseIds.join(",")})`);
    }

    const { data: hearings, error } = await supabase
      .from("hearings")
      .select("id, case_id, matter_id, scheduled_at, status, location, judge, notes, created_at")
      .or(orParts.join(","))
      .order("scheduled_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: `Failed to load hearings: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: hearings ?? [] });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 401 || status === 403) {
      return NextResponse.json({ message: status === 401 ? "Unauthorized." : "Forbidden." }, { status });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
