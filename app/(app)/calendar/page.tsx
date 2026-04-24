import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewHearingSheet } from "@/components/calendar/new-hearing-sheet";
import { HearingTimeline } from "@/components/calendar/hearing-timeline";
import { Calendar as CalendarIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Calendar • Lawyer Diary",
};

export default async function CalendarPage() {
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

  // STRICT BLOCKING: Enforce subscription access (backup to middleware)
  const { enforceSubscriptionAccess } = await import("@/lib/server/subscription-check");
  await enforceSubscriptionAccess(profile.firm_id);

  const { data: hearings } = await supabase
    .from("hearings")
    .select(
      `
        id,
        scheduled_at,
        duration_minutes,
        location,
        status,
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
    .order("scheduled_at", { ascending: true });

  const { data: matters } = await supabase
    .from("matters")
    .select("id, serial_number, case_number, court_name, client:clients ( full_name )")
    .eq("firm_id", profile.firm_id)
    .order("created_at", { ascending: false });

  const matterOptions =
    matters?.map((matter) => ({
      id: matter.id,
      label: `${matter.serial_number ?? matter.case_number ?? "Matter"} — ${matter.client?.full_name ?? matter.court_name ?? "Client pending"}`,
    })) ?? [];

  const timelineHearings =
    hearings?.map((hearing) => ({
      id: hearing.id,
      matterId: hearing.matter?.id ?? "",
      matterSerial: hearing.matter?.serial_number ?? hearing.matter?.case_number ?? "—",
      matterCourt: hearing.matter?.court_name ?? "Court pending",
      clientName: hearing.matter?.client?.full_name ?? "Client pending",
      scheduledAt: hearing.scheduled_at,
      status: hearing.status,
      durationMinutes: hearing.duration_minutes,
      location: hearing.location,
      notes: hearing.notes,
    })) ?? [];

  return (
    <div className="dark -mx-4 rounded-3xl bg-linear-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-6 lg:mx-0 lg:px-0">
      <div className="space-y-3 sm:space-y-4 lg:px-4">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-200">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight sm:text-lg">
                  Calendar & Hearings
                </h1>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-300/80">
                  Compact docket view built for mobile and fast scanning.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <NewHearingSheet matters={matterOptions} />
            </div>
          </div>
        </div>

        <HearingTimeline hearings={timelineHearings} matters={matterOptions} />
      </div>
    </div>
  );
}

