import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MattersView } from "@/components/cases/matters-view";
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
  const { data: allTeamMembersData } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("firm_id", firmId)
    .not("role", "eq", "client") // Exclude clients from assignment
    .order("full_name");
  
  const allTeamMembers = allTeamMembersData as unknown as Array<{ id: string; full_name?: string | null; email?: string | null; role?: string | null }> | null;

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
    <div className="-mx-4 rounded-3xl bg-linear-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-6 lg:mx-0 lg:px-0">
      <div className="space-y-3 sm:space-y-4 lg:px-4">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-200">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight sm:text-lg">
                  Matters & Cases
                </h1>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-300/80">
                  Drag through stages, filter fast, and open details in one click.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
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

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:p-5">
          <div className="mb-3">
            <h2 className="text-base font-black tracking-tight text-slate-100 sm:text-lg">
              Matter list
            </h2>
            <p className="mt-0.5 text-xs text-slate-300/80">
              Switch between list and Kanban; updates save automatically.
            </p>
          </div>

          <MattersView cases={matterItems} />
        </div>
      </div>
    </div>
  );
}

