import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CaseBoard } from "@/components/cases/case-board";
import { Briefcase } from "lucide-react";
import { NewMatterSheet } from "@/components/cases/new-matter-sheet";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Matters • Lawyer Diary",
};

export default async function CasesPage() {
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

  const firmId = profile?.firm_id ?? null;

  if (!firmId) {
    redirect("/onboarding");
  }

  const { data: matters } = await supabase
    .from("matters")
    .select(
      `
        id,
        serial_number,
        matter_status,
        matter_type,
        case_number,
        case_type,
        case_file_date,
        court_name,
        district,
        assigned_attorneys,
        client:clients ( id, full_name )
      `,
    )
    .eq("firm_id", firmId)
    .order("created_at", { ascending: false });

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, name")
    .eq("firm_id", firmId)
    .order("full_name");

  // Fetch ALL team members for case assignment (excluding clients)
  const { data: allTeamMembers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("firm_id", firmId)
    .not("role", "eq", "client") // Exclude clients from assignment
    .order("full_name");

  const matterItems =
    matters?.map((matter) => ({
      id: matter.id,
      serialNumber: matter.serial_number,
      caseNumber: matter.case_number,
      status: matter.matter_status,
      matterType: matter.matter_type,
      caseType: matter.case_type,
      filingDate: matter.case_file_date,
      courtName: matter.court_name,
      district: matter.district,
      clientName: matter.client?.full_name ?? null,
    })) ?? [];

  // Include all team members for assignment (not just staff and senior profiles)
  const staffOptions =
    allTeamMembers?.map((member) => ({
      id: member.id,
      name: member.full_name ?? member.email ?? "Unnamed",
    })) ?? [];

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Hero Header - SAP Fiori Horizon Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <Briefcase className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Matters & Cases</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Track litigation, advisory, and mediation matters across your entire practice.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2">
              <NewMatterSheet
                clients={
                  clients?.map((client: any) => ({
                    id: client.id,
                    name: client.full_name ?? client.name ?? "Unnamed client",
                  })) ?? []
                }
                staff={staffOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data card with toolbar + full-width board */}
      <div className="sap-card-primary">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Matter list</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Search, filter, and open matters; creation and edits happen in the side drawer.
              </p>
            </div>
          </div>

          {/* Existing board already includes its own search + filter UI and list */}
          <CaseBoard cases={matterItems} />
        </div>
      </div>
    </div>
  );
}

