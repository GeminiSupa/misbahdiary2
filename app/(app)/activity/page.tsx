import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { format, formatDistanceToNow } from "date-fns";
import { Activity, User, FileText, Briefcase, Banknote, Users, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityFilters } from "@/components/activity/activity-filters";

export const metadata: Metadata = {
  title: "Activity Log • Lawyer Diary",
};

type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
    email?: string | null;
  } | null;
};

function getActionIcon(action: string) {
  if (action.includes("user")) return User;
  if (action.includes("client")) return Users;
  if (action.includes("matter") || action.includes("case")) return Briefcase;
  if (action.includes("invoice")) return Banknote;
  if (action.includes("password") || action.includes("settings")) return Settings;
  return Activity;
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    user_created: "User Created",
    user_updated: "User Updated",
    user_deleted: "User Deleted",
    client_created: "Client Created",
    client_deleted: "Client Deleted",
    matter_created: "Matter Created",
    matter_deleted: "Matter Deleted",
    invoice_created: "Invoice Created",
    invoice_deleted: "Invoice Deleted",
    invoice_voided: "Invoice Voided",
    password_changed: "Password Changed",
  };
  return labels[action] || action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getActionColor(action: string): string {
  if (action.includes("created")) return "success";
  if (action.includes("deleted") || action.includes("voided")) return "destructive";
  if (action.includes("updated") || action.includes("changed")) return "primary";
  return "default";
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { action?: string; entity_type?: string; search?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

  // Build query
  let query = (supabase as any)
    .from("audit_logs")
    .select(`
      id,
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent,
      created_at,
      user:profiles!audit_logs_user_id_fkey(full_name)
    `)
    .eq("firm_id", profile.firm_id)
    .order("created_at", { ascending: false })
    .limit(100);

  // Apply filters
  if (searchParams.action) {
    query = query.eq("action", searchParams.action);
  }
  if (searchParams.entity_type) {
    query = query.eq("entity_type", searchParams.entity_type);
  }

  const { data: auditLogs, error } = await query;

  if (error) {
    console.error("Error fetching audit logs:", error);
  }

  // Get unique actions and entity types for filters
  const uniqueActions = Array.from(
    new Set((auditLogs || []).map((log: AuditLog) => log.action))
  ).sort();
  const uniqueEntityTypes = Array.from(
    new Set((auditLogs || []).map((log: AuditLog) => log.entity_type))
  ).sort();

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Hero Header - SAP Fiori Horizon Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <Activity className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Activity Log</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  View all activity and changes in your firm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sap-card-success">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Activity History</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Track all user actions, changes, and system events.
              </p>
            </div>
          </div>
          <div>
          {/* Filters */}
          <ActivityFilters
            actions={uniqueActions as string[]}
            entityTypes={uniqueEntityTypes as string[]}
          />

          {/* Activity Table */}
          {!auditLogs || auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No activity logs found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Activity will appear here as users perform actions
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: AuditLog) => {
                    const ActionIcon = getActionIcon(log.action);
                    const actionColor = getActionColor(log.action);

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {format(new Date(log.created_at), "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "h:mm a")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {log.user?.full_name || "Unknown User"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionColor as any} className="gap-1.5">
                            <ActionIcon className="h-3 w-3" />
                            {getActionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.entity_type === "user" && <User className="h-4 w-4 text-muted-foreground" />}
                            {log.entity_type === "client" && <Users className="h-4 w-4 text-muted-foreground" />}
                            {log.entity_type === "matter" && <Briefcase className="h-4 w-4 text-muted-foreground" />}
                            {log.entity_type === "invoice" && <Banknote className="h-4 w-4 text-muted-foreground" />}
                            <span className="text-sm capitalize">{log.entity_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <div className="text-sm text-muted-foreground">
                              {Object.entries(log.details)
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <div key={key} className="truncate">
                                    <span className="font-medium">{key}:</span>{" "}
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              {Object.keys(log.details).length > 2 && (
                                <span className="text-xs">
                                  +{Object.keys(log.details).length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
