import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MatterTimeline } from "@/components/cases/matter-timeline";
import { MatterFinanceCard } from "@/components/cases/matter-finance-card";
import { MatterDocumentsCard } from "@/components/cases/matter-documents-card";
import { MatterTeamCard } from "@/components/cases/matter-team-card";
import { EditMatterSheet } from "@/components/cases/edit-matter-sheet";
import { DeleteMatterButton } from "@/components/cases/delete-matter-button";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  MapPin,
  FileText,
  Scale,
  Building2,
  User,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpdateMatterFormValues } from "@/app/(app)/cases/[id]/actions";

export const metadata: Metadata = {
  title: "Matter details • Lawyer Diary",
};

type TimelineEntry = {
  id: string;
  date: string;
  details: string;
  stage?: string | null;
  courtName?: string | null;
  hearingDate?: string | null;
  updatedByName?: string | null;
};

type DocumentDisplay = {
  id: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
  uploadedBy?: string | null;
};

type TeamMemberDisplay = {
  id: string;
  name: string;
  email: string;
  firmRole?: string | null;
  assignmentRole?: string | null;
  courts: string[];
  districts: string[];
};

type MatterDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatterDetailPage({ params }: MatterDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
    });
  }

  if (!profile?.firm_id) {
    redirect("/onboarding");
  }

  // Fetch matter with client relationship
  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .select(
      `
        id,
        serial_number,
        case_number,
        matter_status,
        matter_type,
        case_type,
        court_name,
        district,
        case_file_date,
        client_brief,
        assigned_attorneys,
        against_parties,
        evidence_provided,
        documents_provided,
        pending_documents,
        metadata,
        created_at,
        updated_at,
        client_id,
        client:clients (
          id,
          full_name,
          representation,
          representative_details
        )
      `,
    )
    .eq("id", id)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (matterError) {
    console.error("Error fetching matter:", {
      message: matterError.message,
      details: matterError.details,
      hint: matterError.hint,
      code: matterError.code,
    });
  }

  if (!matter) {
    notFound();
  }

  // Fetch related data separately to avoid nested query issues
  const [financesResult, caseHistoriesResult, documentsResult] = await Promise.all([
    supabase
      .from("finances")
      .select("fee_total, fee_paid, fee_pending, payment_history, updated_at")
      .eq("matter_id", matter.id)
      .maybeSingle(),
    supabase
      .from("case_histories")
      .select("id, date, details, stage, court_name, hearing_date, updated_by, created_at")
      .eq("matter_id", matter.id)
      .order("date", { ascending: false }),
    supabase
      .from("documents")
      .select("id, file_name, storage_path, uploaded_by, created_at")
      .eq("matter_id", matter.id)
      .order("created_at", { ascending: false }),
  ]);

  if (financesResult.error) {
    console.error("Error fetching finances:", {
      message: financesResult.error.message,
      details: financesResult.error.details,
      hint: financesResult.error.hint,
      code: financesResult.error.code,
    });
  }

  if (caseHistoriesResult.error) {
    console.error("Error fetching case histories:", {
      message: caseHistoriesResult.error.message,
      details: caseHistoriesResult.error.details,
      hint: caseHistoriesResult.error.hint,
      code: caseHistoriesResult.error.code,
    });
  }

  if (documentsResult.error) {
    console.error("Error fetching documents:", {
      message: documentsResult.error.message,
      details: documentsResult.error.details,
      hint: documentsResult.error.hint,
      code: documentsResult.error.code,
    });
  }

  const assignedAttorneys = Array.isArray(matter.assigned_attorneys)
    ? matter.assigned_attorneys.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];

  const profileIds = new Set<string>();
  assignedAttorneys.forEach((id) => profileIds.add(id));
  caseHistoriesResult.data?.forEach((entry) => {
    if (entry.updated_by) {
      profileIds.add(entry.updated_by);
    }
  });
  documentsResult.data?.forEach((doc) => {
    if (doc.uploaded_by) {
      profileIds.add(doc.uploaded_by);
    }
  });

  let relatedProfiles: { data: any[] | null; error: any } = { data: null, error: null };

  if (profileIds.size > 0) {
    const result = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", Array.from(profileIds));

    relatedProfiles = result;

    // Silently ignore errors - Supabase may return error objects even for successful queries
    // If there's no data and we need debugging, enable the debug log below
    if (result.error && !result.data && process.env.NODE_ENV === 'development') {
      // Debug logging only in development to inspect error objects
      const errorObj = result.error as any;
      const errorKeys = Object.keys(errorObj || {});
      if (errorKeys.length > 0) {
        const hasMeaningfulError = errorKeys.some(key => {
          const val = errorObj[key];
          return val !== null && val !== undefined && val !== '' && String(val).trim().length > 0;
        });
        if (hasMeaningfulError) {
          // Only log in development if there's a meaningful error
          console.debug("Debug: Related profiles fetch error:", errorObj);
        }
      }
    }
  }

  const profileMap = new Map<string, any>();
  relatedProfiles.data?.forEach((row: any) => {
    profileMap.set(row.id, row);
  });

  let staffRows: { data: any[] | null; error: any } = { data: null, error: null };

  if (assignedAttorneys.length > 0) {
    const result = await supabase
      .from("staff")
      .select("user_id, role, assigned_courts, assigned_districts")
      .in("user_id", assignedAttorneys);

    staffRows = result;

    // Only log if there's a real error: error exists, no data returned, AND error has meaningful content
    if (result.error && !result.data) {
      const errorObj = result.error as any;
      // Only log if error has actual meaningful properties with non-empty values
      const hasMessage = errorObj?.message && typeof errorObj.message === "string" && errorObj.message.trim().length > 0;
      const hasCode = errorObj?.code && typeof errorObj.code === "string" && errorObj.code.trim().length > 0;
      const hasDetails = errorObj?.details && typeof errorObj.details === "string" && errorObj.details.trim().length > 0;
      const hasHint = errorObj?.hint && typeof errorObj.hint === "string" && errorObj.hint.trim().length > 0;

      if (hasMessage || hasCode || hasDetails || hasHint) {
        console.error("Error fetching staff:", {
          message: errorObj.message ?? "Unknown error",
          details: errorObj.details ?? null,
          hint: errorObj.hint ?? null,
          code: errorObj.code ?? null,
        });
      }
    }
  }

  const staffMap = new Map<string, any>();
  staffRows.data?.forEach((row: any) => {
    staffMap.set(row.user_id, row);
  });

  const finance = financesResult.data;

  const timelineEntries: TimelineEntry[] = (caseHistoriesResult.data ?? []).map((entry) => ({
    id: entry.id,
    date: entry.date,
    details: entry.details,
    stage: entry.stage ?? null,
    courtName: entry.court_name ?? null,
    hearingDate: entry.hearing_date ?? null,
    updatedByName: entry.updated_by ? profileMap.get(entry.updated_by)?.full_name ?? null : null,
  }));

  const documents: DocumentDisplay[] = (documentsResult.data ?? []).map((doc) => ({
    id: doc.id,
    fileName: doc.file_name,
    storagePath: doc.storage_path,
    createdAt: doc.created_at,
    uploadedBy: doc.uploaded_by ? profileMap.get(doc.uploaded_by)?.full_name ?? null : null,
  }));

  const teamMembers: TeamMemberDisplay[] = assignedAttorneys.map((id) => {
    const profileRow = profileMap.get(id);
    const staffRow = staffMap.get(id);
    return {
      id,
      name: profileRow?.full_name ?? "Unnamed teammate",
      email: profileRow?.email ?? "",
      firmRole: profileRow?.role ?? null,
      assignmentRole: staffRow?.role ?? null,
      courts: staffRow?.assigned_courts ?? [],
      districts: staffRow?.assigned_districts ?? [],
    };
  });

  const matterSummary = {
    serial: matter.serial_number ?? "N/A",
    caseNumber: matter.case_number ?? null,
    status: matter.matter_status ?? null,
    matterType: matter.matter_type ?? null,
    caseType: matter.case_type ?? null,
    courtName: matter.court_name ?? null,
    district: matter.district ?? null,
    caseFileDate: matter.case_file_date ? format(new Date(matter.case_file_date), "dd MMM yyyy") : null,
    clientBrief: matter.client_brief ?? null,
  };

  const clientData = Array.isArray(matter.client) ? matter.client[0] : matter.client;
  const clientSummary = {
    name: (clientData as any)?.full_name ?? "Client pending",
    representation: (clientData as any)?.representation ?? null,
    representativeDetails: (clientData as any)?.representative_details ?? null,
  };

  // Fetch clients and ALL team members for edit form (excluding clients from assignment)
  const { data: allClients } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("firm_id", profile.firm_id)
    .order("full_name");

  // Fetch ALL team members for case assignment (excluding clients)
  // Note: email is not in profiles table, it's in auth.users
  const { data: allTeamMembers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("firm_id", profile.firm_id)
    .neq("role", "client") // Exclude clients from assignment
    .order("full_name");

  const clientOptions =
    allClients?.map((c) => ({
      id: c.id,
      label: c.full_name ?? "Unnamed client",
    })) ?? [];

  // Include all team members for assignment
  // Type assertion needed due to TypeScript type inference issues
  const teamMembersData = (allTeamMembers as Array<{ id: string; full_name?: string | null }> | null) ?? [];
  const staffOptions =
    teamMembersData.map((member) => ({
      id: member.id,
      label: member.full_name ?? "Unnamed teammate",
    }));

  // Convert matter to form values
  const againstPartiesData = matter.against_parties as any;
  const matterFormValues: UpdateMatterFormValues = {
    id: matter.id,
    clientId: matter.client_id,
    matterType: matter.matter_type as any,
    matterStatus: matter.matter_status as any,
    caseNumber: matter.case_number ?? "",
    caseFileDate: matter.case_file_date ? new Date(matter.case_file_date).toISOString().slice(0, 10) : "",
    caseType: (matter.case_type as any) ?? "",
    courtName: matter.court_name ?? "",
    district: matter.district ?? "",
    clientBrief: matter.client_brief ?? "",
    againstParties: againstPartiesData?.details ?? "",
    againstPartiesType: (againstPartiesData?.type as any) ?? "individual",
    evidenceProvided: Array.isArray(matter.evidence_provided) ? matter.evidence_provided.join("\n") : "",
    documentsProvided: Array.isArray(matter.documents_provided) ? matter.documents_provided.join("\n") : "",
    pendingDocuments: Array.isArray(matter.pending_documents) ? matter.pending_documents.join("\n") : "",
    assignedAttorneys: Array.isArray(matter.assigned_attorneys) ? matter.assigned_attorneys : [],
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 shadow-xl backdrop-blur sm:rounded-3xl sm:p-6 md:p-8">
        <div className="relative z-10 space-y-4 sm:space-y-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-fit -ml-1 text-xs text-muted-foreground hover:text-foreground sm:-ml-2 sm:text-sm"
          >
            <Link href="/cases">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              Back to matters
            </Link>
          </Button>

          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2 sm:space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 shadow-lg flex-shrink-0 sm:h-12 sm:w-12 sm:rounded-xl">
                  <Briefcase className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-primary sm:text-xs">
                    Serial {matterSummary.serial}
                  </p>
                  <h1 className="text-xl font-bold text-foreground truncate sm:text-2xl md:text-3xl">{clientSummary.name}</h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {matterSummary.status && (
                  <Badge variant="outline" className="capitalize text-[10px] font-medium sm:text-xs">
                    {matterSummary.status}
                  </Badge>
                )}
                {matterSummary.matterType && (
                  <Badge variant="secondary" className="capitalize text-[10px] font-medium sm:text-xs">
                    {matterSummary.matterType}
                  </Badge>
                )}
                {matterSummary.caseType && (
                  <Badge variant="secondary" className="capitalize text-[10px] font-medium sm:text-xs">
                    {matterSummary.caseType}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EditMatterSheet
                matter={matterFormValues}
                clients={clientOptions}
                staff={staffOptions}
              />
              <DeleteMatterButton
                matterId={matter.id}
                matterSerial={matter.serial_number}
                size="sm"
              />
            </div>
          </div>

          {/* Summary Grid */}
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={Scale}
              label="Court"
              value={matterSummary.courtName}
              className="bg-blue-500/10 border-blue-200/50"
              iconClassName="text-blue-600"
            />
            <SummaryCard
              icon={MapPin}
              label="District"
              value={matterSummary.district}
              className="bg-purple-500/10 border-purple-200/50"
              iconClassName="text-purple-600"
            />
            <SummaryCard
              icon={FileText}
              label="Case Number"
              value={matterSummary.caseNumber}
              className="bg-emerald-500/10 border-emerald-200/50"
              iconClassName="text-emerald-600"
            />
            <SummaryCard
              icon={Calendar}
              label="Filed Date"
              value={matterSummary.caseFileDate}
              className="bg-amber-500/10 border-amber-200/50"
              iconClassName="text-amber-600"
            />
          </div>

          {matterSummary.clientBrief && (
            <div className="rounded-xl border border-border/60 bg-background/80 p-3 backdrop-blur-sm sm:rounded-2xl sm:p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <FileText className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                <h2 className="text-xs font-semibold text-foreground sm:text-sm">Client Brief</h2>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line sm:text-sm">
                {matterSummary.clientBrief}
              </p>
            </div>
          )}
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4 sm:space-y-6">
          <MatterTimeline entries={timelineEntries} matterId={matter.id} />
          <MatterDocumentsCard matterId={matter.id} documents={documents} />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <MatterFinanceCard finance={finance} matterId={matter.id} />
          <MatterTeamCard members={teamMembers as any} client={clientSummary} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  className,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  if (!value) return null;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-gradient-to-br p-3 shadow-sm transition-all duration-300 sm:rounded-xl sm:p-4 hover:scale-[1.02] hover:shadow-md",
        className,
      )}
    >
      <div className="relative z-10 flex items-center gap-2 sm:gap-3">
        <div className={cn("rounded-md bg-background/80 p-1.5 shadow-sm flex-shrink-0 sm:rounded-lg sm:p-2", iconClassName)}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-foreground sm:mt-1 sm:text-sm">{value}</p>
        </div>
      </div>
    </div>
  );
}
