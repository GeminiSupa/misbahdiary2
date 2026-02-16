import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/server/access-control";
import { listAllUsers } from "@/app/(app)/admin/actions";
import { Users, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { UserTableRow } from "@/components/admin/user-table-row";
import { UserCard } from "@/components/admin/user-card";

export default async function AdminUsersPage() {
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

  const result = await listAllUsers();
  if ("message" in result) {
    return (
      <div className="sap-card">
        <div className="sap-card-body">
          <p className="text-destructive">{result.message}</p>
        </div>
      </div>
    );
  }

  const users = "users" in result ? result.users : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <Users className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">All Users</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  View all users, firm owners, and subscription status.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="min-h-[48px] min-w-fit whitespace-nowrap">
                <Link href="/admin" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button asChild className="min-h-[48px] min-w-fit whitespace-nowrap">
                <Link href="/admin/firms" className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 shrink-0" />
                  View Firms
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users yet</h3>
            <p className="text-sm text-muted-foreground">No users have signed up on the platform.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="grid gap-4 md:hidden">
            {users.map((u) => (
              <UserCard key={u.id} {...u} />
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Firm</th>
                  <th className="text-left py-3 px-4 font-medium">Subscription</th>
                  <th className="text-left py-3 px-4 font-medium w-[1%] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserTableRow key={u.id} {...u} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
