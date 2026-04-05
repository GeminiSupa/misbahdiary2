import { NextResponse } from "next/server";
import { requireClientPortalAccess } from "@/lib/server/client-portal";
import { fetchPortalMatterIds } from "@/lib/server/client-portal-matters";

export async function GET() {
  try {
    const { supabase, client } = await requireClientPortalAccess();

    const matterIds = await fetchPortalMatterIds(supabase, client.id);

    const orParts: string[] = [`client_id.eq.${client.id}`];
    if (matterIds.length > 0) {
      orParts.push(`matter_id.in.(${matterIds.join(",")})`);
    }

    const { data: payments, error } = await supabase
      .from("invoices")
      .select(
        "id, case_id, matter_id, invoice_number, status, issue_date, due_date, paid_at, subtotal, tax_amount, discount_amount, total_amount, amount_paid, billing_currency, created_at",
      )
      .or(orParts.join(","))
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ message: `Failed to load payments: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: payments ?? [] });
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
