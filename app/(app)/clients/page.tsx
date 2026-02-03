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

  // STRICT BLOCKING: Enforce subscription access (backup to middleware)
  const { enforceSubscriptionAccess } = await import("@/lib/server/subscription-check");
  await enforceSubscriptionAccess(profile.firm_id);

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
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Hero Header - SAP Fiori Horizon Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <UsersRound className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Clients & Teams</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Maintain a single source of truth for client contact details, communication notes, and matter history.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2">
              <NewClientSheet />
            </div>
          </div>
        </div>
      </div>

      {/* Clients List - In Card Container (Like Billing Page) */}
      <div className="sap-card-success">
        <div className="sap-card-body space-y-4">
          <ClientManager clients={(clients as any) ?? []} />
        </div>
      </div>
    </div>
  );
}

