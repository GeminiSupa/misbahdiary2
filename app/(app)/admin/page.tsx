import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/server/access-control";
import { Building2, Users, Briefcase, FileText, ArrowRight, CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
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

  // Use admin client to bypass RLS - super admins need accurate platform stats
  const { supabaseAdminClient } = await import("@/lib/supabase/admin");
  const [firmsCount, usersCount, mattersCount, clientsCount] = await Promise.all([
    supabaseAdminClient.from("firms").select("id", { count: "exact", head: true }),
    supabaseAdminClient.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdminClient.from("matters").select("id", { count: "exact", head: true }),
    supabaseAdminClient.from("clients").select("id", { count: "exact", head: true }),
  ]);

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
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Super Admin Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Manage firms, create new firm owners, and monitor platform activity.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2">
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

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Firms</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{firmsCount.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active firms on platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">All platform users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matters</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mattersCount.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">All cases across firms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount.count ?? 0}</div>
            <p className="text-xs text-muted-foreground">All clients across firms</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View all users, firm owners, and subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full min-h-[48px]">
              <Link href="/admin/users" className="flex items-center justify-center">
                <Users className="mr-2 h-4 w-4 shrink-0" />
                View All Users
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firm Management</CardTitle>
            <CardDescription>View and manage all firms on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full min-h-[48px]">
              <Link href="/admin/firms" className="flex items-center justify-center">
                View All Firms
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create New Firm</CardTitle>
            <CardDescription>Add a new firm and create the firm owner account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full min-h-[48px]">
              <Link href="/admin/firms/create" className="flex items-center justify-center">
                Create Firm
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Manage Subscriptions
            </CardTitle>
            <CardDescription>
              Record cash payments and activate or extend customer subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full min-h-[48px]">
              <Link href="/admin/firms" className="flex items-center justify-center">
                <CreditCard className="mr-2 h-4 w-4 shrink-0" />
                Manage Subscriptions
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
