import { NextResponse } from "next/server";
import { requireClientPortalAccess } from "@/lib/server/client-portal";

export async function GET() {
  try {
    const { supabase, client } = await requireClientPortalAccess();

    const { data: lawyers, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("firm_id", client.firm_id)
      .neq("role", "client")
      .order("full_name");

    if (error) {
      return NextResponse.json({ message: `Failed to load lawyers: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: lawyers ?? [] });
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
