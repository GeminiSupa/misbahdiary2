// @ts-nocheck

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientManager } from "@/components/clients/client-manager";
import { UsersRound } from "lucide-react";
import { NewClientSheet } from "@/components/clients/new-client-sheet";

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

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select(
      "id, type, name, full_name, father_name, representation, representative_details, organization_name, email, phone, address, city, province, country, cnic, notes",
    )
    .eq("firm_id", profile.firm_id)
    .order("full_name", { nullsFirst: false });

  if (clientsError) {
    console.error("Error fetching clients:", clientsError);
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 shadow-xl backdrop-blur sm:rounded-3xl sm:p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 shadow-lg flex-shrink-0 sm:h-12 sm:w-12 sm:rounded-2xl md:h-14 md:w-14">
              <UsersRound className="h-5 w-5 text-white sm:h-6 sm:w-6 md:h-7 md:w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">Clients & Teams</h1>
              <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm line-clamp-2">
                Maintain a single source of truth for client contact details, communication notes, and matter history.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2">
            <NewClientSheet />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-purple-400/10 blur-2xl" />
      </div>

      <ClientManager clients={clients ?? []} />
    </div>
  );
}

