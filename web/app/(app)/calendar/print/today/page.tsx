import { format, startOfDay, endOfDay } from "date-fns";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PrintTodayDocketPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    redirect("/onboarding");
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("name")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const { data: hearings } = await supabase
    .from("hearings")
    .select(
      `
        id,
        scheduled_at,
        duration_minutes,
        location,
        status,
        matter:matters (
          serial_number,
          case_number,
          court_name,
          district,
          client:clients ( full_name )
        )
      `,
    )
    .eq("firm_id", profile.firm_id)
    .gte("scheduled_at", dayStart.toISOString())
    .lte("scheduled_at", dayEnd.toISOString())
    .order("scheduled_at", { ascending: true });

  const docketItems =
    hearings?.map((hearing) => ({
      id: hearing.id as string,
      time: hearing.scheduled_at as string,
      durationMinutes: hearing.duration_minutes as number | null,
      status: hearing.status as string | null,
      location: hearing.location as string | null,
      serial: hearing.matter?.serial_number ?? hearing.matter?.case_number ?? "—",
      caseNumber: hearing.matter?.case_number ?? null,
      clientName: hearing.matter?.client?.full_name ?? "Client pending",
      courtName: hearing.matter?.court_name ?? "Court pending",
      district: hearing.matter?.district ?? null,
    })) ?? [];

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-black print:p-0">
      <div className="mx-auto max-w-5xl">
        {/* Header block */}
        <header className="mb-6 border-b border-black/60 pb-4 text-center print:mb-4">
          <p className="text-xs uppercase tracking-[0.2em]">Daily Cause List</p>
          <h1 className="mt-1 text-2xl font-semibold">
            {firm?.name ?? "Law Firm"} – Today&apos;s Docket
          </h1>
          <p className="mt-1 text-xs">
            {format(today, "EEEE, dd MMMM yyyy")} &nbsp;|&nbsp; Generated from Lawyer Diary
          </p>
        </header>

        {/* Meta row */}
        <section className="mb-4 flex items-center justify-between text-xs print:mb-2">
          <div>
            <p>
              Advocate: <span className="font-medium">{user.email}</span>
            </p>
          </div>
          <div className="text-right">
            <p>
              Total hearings today: <span className="font-medium">{docketItems.length}</span>
            </p>
          </div>
        </section>

        {/* Docket table */}
        {docketItems.length > 0 ? (
          <table className="w-full border-collapse text-xs print:text-[11px]">
            <thead>
              <tr>
                <th className="border border-black/60 bg-gray-50 px-2 py-2 text-left font-semibold">
                  Time
                </th>
                <th className="border border-black/60 bg-gray-50 px-2 py-2 text-left font-semibold">
                  Case / Serial
                </th>
                <th className="border border-black/60 bg-gray-50 px-2 py-2 text-left font-semibold">
                  Parties / Client
                </th>
                <th className="border border-black/60 bg-gray-50 px-2 py-2 text-left font-semibold">
                  Court / Bench
                </th>
                <th className="border border-black/60 bg-gray-50 px-2 py-2 text-left font-semibold">
                  Station
                </th>
                <th className="border border-black/60 bg-gray-50 px-2 py-2 text-left font-semibold">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {docketItems.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="border border-black/40 px-2 py-1">
                    <div>{format(new Date(item.time), "p")}</div>
                    {item.durationMinutes ? (
                      <div className="mt-0.5 text-[10px] text-gray-600">
                        {item.durationMinutes} min
                      </div>
                    ) : null}
                  </td>
                  <td className="border border-black/40 px-2 py-1">
                    <div className="font-medium">{item.serial}</div>
                    {item.caseNumber ? (
                      <div className="mt-0.5 text-[10px] text-gray-600">
                        Case: {item.caseNumber}
                      </div>
                    ) : null}
                  </td>
                  <td className="border border-black/40 px-2 py-1">
                    <div>{item.clientName}</div>
                  </td>
                  <td className="border border-black/40 px-2 py-1">
                    <div>{item.courtName}</div>
                  </td>
                  <td className="border border-black/40 px-2 py-1">
                    <div>{item.district ?? "-"}</div>
                    {item.location ? (
                      <div className="mt-0.5 text-[10px] text-gray-600">{item.location}</div>
                    ) : null}
                  </td>
                  <td className="border border-black/40 px-2 py-1">
                    <div className="h-8" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-8 text-center text-sm">
            No hearings scheduled for today for this firm.
          </p>
        )}

        {/* Footer note */}
        <footer className="mt-8 text-[10px] text-gray-600 print:mt-4">
          <p>
            This docket is generated automatically for advocate use only. Verify timings and court
            rosters with the official cause list where required.
          </p>
        </footer>
      </div>
    </main>
  );
}


