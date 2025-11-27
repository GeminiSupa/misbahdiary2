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
  assignmentRole?: StaffRow["role"] | null;
  courts: string[];
  districts: string[];
};

type MatterDetailPageProps = {
  params: { id: string };
};

export default async function MatterDetailPage({ params }: MatterDetailPageProps) {
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

  const { data: matter } = await supabase
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
        metadata,
        created_at,
        updated_at,
        client:clients (
          id,
          full_name,
          representation,
          representative_details
        ),
        finances:finances (
          fee_total,
          fee_paid,
          fee_pending,
          payment_history,
          updated_at
        ),
        case_histories:case_histories (
          id,
          date,
          details,
          stage,
          court_name,
          hearing_date,
          updated_by,
          created_at
        ),
        documents:documents (
          id,
          file_name,
          storage_path,
          uploaded_by,
          created_at
        )
      `,
    )
    .eq("id", params.id)
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  if (!matter) {
    notFound();
  }

  const assignedAttorneys = Array.isArray(matter.assigned_attorneys)
    ? (matter.assigned_attorneys.filter((value): value is string => typeof value === "string" && value.length > 0))
    : [];

  const profileIds = new Set<string>();
  assignedAttorneys.forEach((id) => profileIds.add(id));
  matter.case_histories?.forEach((entry) => {
    if (entry.updated_by) {
      profileIds.add(entry.updated_by);
    }
  });
  matter.documents?.forEach((doc) => {
    if (doc.uploaded_by) {
      profileIds.add(doc.uploaded_by);
    }
  });

  const relatedProfiles = profileIds.size
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", Array.from(profileIds))
    : null;

  const profileMap = new Map<string, ProfileRow & { email: string | null }>();
  relatedProfiles?.data?.forEach((row) => {
    profileMap.set(row.id, row as ProfileRow & { email: string | null });
  });

  const staffRows = assignedAttorneys.length
    ? await supabase
        .from("staff")
        .select("user_id, role, assigned_courts, assigned_districts")
        .in("user_id", assignedAttorneys)
    : null;

  const staffMap = new Map<string, StaffRow>();
  staffRows?.data?.forEach((row) => {
    staffMap.set(row.user_id, row as StaffRow);
  });

  const finance = matter.finances?.[0] ?? null;

  const timelineEntries: TimelineEntry[] = [...(matter.case_histories ?? [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      details: entry.details,
      stage: entry.stage,
      courtName: entry.court_name,
      hearingDate: entry.hearing_date,
      updatedByName: entry.updated_by ? profileMap.get(entry.updated_by)?.full_name ?? null : null,
    }));

  const documents: DocumentDisplay[] = (matter.documents ?? [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((doc) => ({
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
    serial: matter.serial_number,
    caseNumber: matter.case_number,
    status: matter.matter_status,
    matterType: matter.matter_type,
    caseType: matter.case_type,
    courtName: matter.court_name,
    district: matter.district,
    caseFileDate: matter.case_file_date ? format(new Date(matter.case_file_date), "dd MMM yyyy") : null,
    clientBrief: matter.client_brief,
  };

  const clientSummary = {
    name: matter.client?.full_name ?? "Client pending",
    representation: matter.client?.representation ?? null,
    representativeDetails: matter.client?.representative_details,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div className="space-y-1">
              <Button asChild variant="ghost" size="sm" className="w-fit px-0 text-sm text-muted-foreground hover:text-foreground">
                <Link href="/cases">&larr; Back to matters</Link>
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Serial {matterSummary.serial}</p>
                <h1 className="text-2xl font-semibold text-foreground">{clientSummary.name}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {matterSummary.status ? (
                <Badge variant="outline" className="capitalize">
                  {matterSummary.status}
                </Badge>
              ) : null}
              {matterSummary.matterType ? (
                <Badge variant="secondary" className="capitalize">
                  {matterSummary.matterType}
                </Badge>
              ) : null}
              {matterSummary.caseType ? (
                <Badge variant="secondary" className="capitalize">
                  {matterSummary.caseType}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground">
            <SummaryItem label="Court" value={matterSummary.courtName} />
            <SummaryItem label="District" value={matterSummary.district} />
            <SummaryItem label="Case number" value={matterSummary.caseNumber} />
            <SummaryItem label="Filed" value={matterSummary.caseFileDate} />
          </div>

          {matterSummary.clientBrief ? (
            <div>
              <Separator className="my-3" />
              <h2 className="text-sm font-semibold text-foreground">Client brief</h2>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{matterSummary.clientBrief}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="sap-section-grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <MatterTimeline entries={timelineEntries} />
          <MatterDocumentsCard matterId={matter.id} documents={documents} />
        </div>
        <div className="space-y-6">
          <MatterFinanceCard finance={finance} />
          <MatterTeamCard members={teamMembers} client={clientSummary} />
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-foreground">{value}</p>
    </div>
  );
}
