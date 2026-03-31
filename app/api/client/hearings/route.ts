import { NextResponse } from "next/server";
import { requireClientPortalAccess } from "@/lib/server/client-portal";

export async function GET() {
  try {
    const { supabase, client } = await requireClientPortalAccess();

    const { data: clientCases, error: caseError } = await supabase
      .from("cases")
      .select("id")
      .eq("client_id", client.id);

    if (caseError) {
      return NextResponse.json(
        { message: `Failed to resolve client cases: ${caseError.message}` },
        { status: 500 },
      );
    }

    const caseIds = (clientCases ?? []).map((item) => item.id);
    if (caseIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: hearings, error } = await supabase
      .from("hearings")
      .select("id, case_id, matter_id, scheduled_at, status, location, judge, notes, created_at")
      .in("case_id", caseIds)
      .order("scheduled_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: `Failed to load hearings: ${error.message}` },
        { status: 500 },
      );
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
