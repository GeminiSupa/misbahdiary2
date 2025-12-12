import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const hearingId = id;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // For security, require an authenticated user and firm context
  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return NextResponse.json({ message: "No firm context" }, { status: 400 });
  }

  const { data: hearing, error } = await supabase
    .from("hearings")
    .select(
      `
        id,
        scheduled_at,
        duration_minutes,
        location,
        notes,
        matter:matters (
          id,
          serial_number,
          case_number,
          court_name,
          client:clients ( full_name )
        )
      `,
    )
    .eq("firm_id", profile.firm_id)
    .eq("id", hearingId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: `Error loading hearing: ${error.message}` }, { status: 500 });
  }

  if (!hearing) {
    return NextResponse.json({ message: "Hearing not found" }, { status: 404 });
  }

  const start = new Date(hearing.scheduled_at);
  const dtStamp = formatDate(new Date());
  const dtStart = formatDate(start);
  const durationMinutes = hearing.duration_minutes ?? 30;
  const dtEnd = formatDate(new Date(start.getTime() + durationMinutes * 60 * 1000));

  const matterLabel = hearing.matter?.serial_number ?? hearing.matter?.case_number ?? "Matter";
  const clientName = hearing.matter?.client?.full_name ?? "";
  const courtName = hearing.matter?.court_name ?? "";

  const summaryParts = ["Hearing", matterLabel];
  if (clientName) summaryParts.push(`Client: ${clientName}`);
  if (courtName) summaryParts.push(`Court: ${courtName}`);

  const summary = summaryParts.join(" • ");
  const description = hearing.notes ?? "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lawyer Diary//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${hearing.id}@lawyer-diary`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(summary)}`,
    hearing.location ? `LOCATION:${escapeText(hearing.location)}` : "",
    description ? `DESCRIPTION:${escapeText(description)}` : "",
    hearing.matter?.serial_number || hearing.matter?.case_number
      ? `CATEGORIES:${escapeText(hearing.matter?.serial_number ?? hearing.matter?.case_number ?? "")}`
      : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="hearing-${hearing.id}.ics"`,
    },
  });
}

function formatDate(date: Date) {
  const pad = (number: number) => number.toString().padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function escapeText(text: string) {
  return text.replace(/\\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

