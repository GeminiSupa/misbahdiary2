import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientManager } from "@/components/clients/client-manager";
import { UsersRound, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ClientForm } from "@/components/clients/client-form";

export const metadata: Metadata = {
  title: "Clients • Lawyer Diary",
};

export default async function ClientsPage() {
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

  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, type, name, full_name, father_name, representation, representative_details, organization_name, email, phone, address, city, province, country, cnic, notes",
    )
    .eq("firm_id", profile.firm_id)
    .order("full_name");

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-xl backdrop-blur">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500 shadow-lg">
              <UsersRound className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Clients & Teams</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Maintain a single source of truth for client contact details, communication notes, and matter history.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New client
                </button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>New client</SheetTitle>
                </SheetHeader>
                <div className="mt-2 h-full overflow-y-auto">
                  <ClientForm />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-purple-400/10 blur-2xl" />
      </div>

      <ClientManager clients={clients ?? []} />
    </div>
  );
}

