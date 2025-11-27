import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HearingForm } from "@/components/calendar/hearing-form";
import { HearingTimeline } from "@/components/calendar/hearing-timeline";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-xl backdrop-blur">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg">
              <CalendarIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Calendar & Hearings</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep track of upcoming hearings, adjournments, and post-hearing notes across all matters.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule hearing
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Schedule hearing</SheetTitle>
                </SheetHeader>
                <div className="mt-2 h-full overflow-y-auto">
                  <HearingForm matters={matterOptions} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
      </div>

      {/* Hearings timeline with full width and sheet-based creation */}
      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Hearings docket</h2>
              <p className="text-sm text-muted-foreground">
                Upcoming and past hearings organised chronologically; creation happens in the side drawer.
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule hearing
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Schedule hearing</SheetTitle>
                </SheetHeader>
                <div className="mt-2 h-full overflow-y-auto">
                  <HearingForm matters={matterOptions} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <HearingTimeline hearings={timelineHearings} matters={matterOptions} />
        </div>
      </div>
    </div>
  );
}

