import { NextResponse } from "next/server";
import { requireClientPortalAccess } from "@/lib/server/client-portal";

export async function GET() {
  try {
    const { supabase, client } = await requireClientPortalAccess();

    // Security: derive client scope from authenticated user only.
    const { data: cases, error } = await supabase
      .from("cases")
      .select("id, client_id, case_number, title, status, case_type, court_name, filing_date, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: `Failed to load cases: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: cases ?? [] });
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
