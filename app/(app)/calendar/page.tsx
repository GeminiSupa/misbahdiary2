import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewHearingSheet } from "@/components/calendar/new-hearing-sheet";
import { HearingTimeline } from "@/components/calendar/hearing-timeline";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

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
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Hero Header - SAP Fiori Horizon Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm flex-shrink-0 sm:h-14 sm:w-14">
                <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Calendar & Hearings</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Keep track of upcoming hearings, adjournments, and post-hearing notes across all matters.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NewHearingSheet matters={matterOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Hearings timeline with full width and sheet-based creation */}
      <div className="sap-card-warning">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Hearings docket</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Upcoming and past hearings organised chronologically; creation happens in the side drawer.
              </p>
            </div>
            <NewHearingSheet matters={matterOptions} variant="outline" size="sm" />
          </div>

          <HearingTimeline hearings={timelineHearings} matters={matterOptions} />
        </div>
      </div>
    </div>
  );
}

