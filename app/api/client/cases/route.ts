import { NextResponse } from "next/server";
import { requireClientPortalAccess } from "@/lib/server/client-portal";
import { formatMatterPortalTitle } from "@/lib/server/client-portal-matters";

const PROGRESS_PER_MATTER = 20;
/** Cap rows scanned when bucketing per-matter recent history (global date desc). */
const MAX_HISTORY_SCAN = 5000;

export async function GET() {
  try {
    const { supabase, client } = await requireClientPortalAccess();

    const { data: matters, error: mattersError } = await supabase
      .from("matters")
      .select(
        "id, serial_number, case_number, matter_status, matter_type, case_type, case_type_other, court_name, case_file_date, created_at",
      )
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (mattersError) {
      return NextResponse.json({ message: `Failed to load matters: ${mattersError.message}` }, { status: 500 });
    }

    const matterList = matters ?? [];
    const matterIds = matterList.map((m) => m.id);

    // Backwards-compat: some older records live in `cases` (not `matters`).
    const { data: legacyCases, error: legacyError } = await supabase
      .from("cases")
      .select("id, case_number, title, status, case_type, court_name, filing_date, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (legacyError) {
      return NextResponse.json({ message: `Failed to load legacy cases: ${legacyError.message}` }, { status: 500 });
    }

    let historyByMatter = new Map<
      string,
      Array<{
        id: string;
        date: string;
        details: string;
        stage: string | null;
        court_name: string | null;
        hearing_date: string | null;
        next_hearing_reason: string | null;
      }>
    >();

    if (matterIds.length > 0) {
      const { data: histories, error: historyError } = await supabase
        .from("case_histories")
        .select("id, matter_id, date, details, stage, court_name, hearing_date, next_hearing_reason, created_at")
        .in("matter_id", matterIds)
        .order("date", { ascending: false })
        .limit(MAX_HISTORY_SCAN);

      if (historyError) {
        return NextResponse.json(
          { message: `Failed to load case history: ${historyError.message}` },
          { status: 500 },
        );
      }

      historyByMatter = new Map();
      for (const row of histories ?? []) {
        const list = historyByMatter.get(row.matter_id) ?? [];
        if (list.length >= PROGRESS_PER_MATTER) continue;
        list.push({
          id: row.id,
          date: row.date,
          details: row.details,
          stage: row.stage,
          court_name: row.court_name,
          hearing_date: row.hearing_date,
          next_hearing_reason: row.next_hearing_reason,
        });
        historyByMatter.set(row.matter_id, list);
      }
    }

    const data = matterList.map((m) => ({
      id: m.id,
      matter_id: m.id,
      case_number: m.case_number?.trim() || m.serial_number,
      title: formatMatterPortalTitle(m),
      status: m.matter_status,
      case_type: m.case_type,
      court_name: m.court_name,
      filing_date: m.case_file_date,
      progress: historyByMatter.get(m.id) ?? [],
      created_at: m.created_at,
    }));

    const legacyData = (legacyCases ?? []).map((c) => ({
      id: c.id,
      case_number: c.case_number,
      title: c.title,
      status: c.status,
      case_type: c.case_type,
      court_name: c.court_name,
      filing_date: c.filing_date,
      progress: [] as any[],
      created_at: c.created_at,
    }));

    const combined = [...data, ...legacyData]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(({ created_at, ...rest }) => rest);

    return NextResponse.json({ data: combined });
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
