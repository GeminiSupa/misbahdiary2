import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/server/access-control";
import { listAllFirms } from "@/app/(app)/admin/actions";
import { Building2, ArrowLeft, Mail, User, Calendar, BadgeCheck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { RecordCashPaymentSheet } from "@/components/admin/record-cash-payment-sheet";

export default async function FirmsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const isAdmin = await isSuperAdmin(user.id);
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const result = await listAllFirms();
  if ("message" in result) {
    return (
      <div className="sap-card">
        <div className="sap-card-body">
          <p className="text-destructive">{result.message}</p>
        </div>
      </div>
    );
  }

  const firms = "firms" in result ? result.firms : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">All Firms</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  View and manage all firms on the platform.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="min-h-[48px] min-w-fit">
                <Link href="/admin" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button asChild className="min-h-[48px] min-w-fit">
                <Link href="/admin/firms/create" className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 shrink-0" />
                  Create New Firm
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Firms List */}
      {firms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No firms yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first firm.
            </p>
            <Button asChild>
              <Link href="/admin/firms/create">Create First Firm</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {firms.map((firm) => (
            <Card key={firm.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{firm.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Created {format(new Date(firm.created_at), "MMM dd, yyyy")}
                    </CardDescription>
                  </div>
                  <Building2 className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {firm.contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{firm.contact_email}</span>
                  </div>
                )}
                {firm.owner_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Owner: {firm.owner_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  {firm.subscription_status === "active" ? (
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                  ) : firm.subscription_status === "trial" ? (
                    <Clock className="h-4 w-4 text-amber-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-muted-foreground">
                    {firm.subscription_status === "active"
                      ? firm.subscription_ends_at
                        ? `Active until ${format(new Date(firm.subscription_ends_at), "MMM dd, yyyy")}`
                        : "Active"
                      : firm.subscription_status === "trial"
                        ? firm.trial_ends_at
                          ? `Trial until ${format(new Date(firm.trial_ends_at), "MMM dd, yyyy")}`
                          : "Trial"
                        : firm.subscription_status === "expired"
                          ? "Expired"
                          : firm.subscription_status ?? "Trial"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    {format(new Date(firm.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                  </span>
                </div>
                <RecordCashPaymentSheet
                  firmId={firm.id}
                  firmName={firm.name}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full mt-2 min-h-[48px]">
                      Record Cash Payment
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
