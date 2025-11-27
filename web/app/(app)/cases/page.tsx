import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CaseForm } from "@/components/cases/case-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CaseBoard } from "@/components/cases/case-board";
import { Briefcase, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

  const { data: staffMembers } = await supabase
    .from("staff")
    .select(
      `
        user_id,
        role,
        profile:profiles (
          full_name
        )
      `,
    )
    .eq("firm_id", firmId)
    .order("updated_at", { ascending: false });

  const { data: seniorProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("firm_id", firmId)
    .in("role", ["principal_partner", "associate"])
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

  const staffOptions =
    [
      ...(staffMembers?.map((member) => ({
        id: member.user_id,
        name: member.profile?.full_name ?? "Unnamed",
      })) ?? []),
      ...(seniorProfiles?.map((member) => ({
        id: member.id,
        name: member.full_name ?? "Unnamed",
      })) ?? []),
    ].filter(
      (value, index, self) => self.findIndex((item) => item.id === value.id) === index,
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-xl backdrop-blur">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-lg">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-foreground">Matters & Cases</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track litigation, advisory, and mediation matters across your entire practice.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New matter
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>New matter</SheetTitle>
                </SheetHeader>
                <div className="mt-2 h-full overflow-y-auto">
                  <CaseForm
                    clients={
                      clients?.map((client) => ({
                        id: client.id,
                        name: client.full_name ?? client.name ?? "Unnamed client",
                      })) ?? []
                    }
                    staff={staffOptions}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl" />
      </div>

      {/* Data card with toolbar + full-width board */}
      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Matter list</h2>
              <p className="text-sm text-muted-foreground">
                Search, filter, and open matters; creation and edits happen in the side drawer.
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New matter
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>New matter</SheetTitle>
                </SheetHeader>
                <div className="mt-2 h-full overflow-y-auto">
                  <CaseForm
                    clients={
                      clients?.map((client) => ({
                        id: client.id,
                        name: client.full_name ?? client.name ?? "Unnamed client",
                      })) ?? []
                    }
                    staff={staffOptions}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Existing board already includes its own search + filter UI and list */}
          <CaseBoard cases={matterItems} />
        </div>
      </div>
    </div>
  );
}

