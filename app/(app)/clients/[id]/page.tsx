import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { matterStatusOptions } from "@/lib/constants/cases";
import { ClientDocumentsCard, type ClientDocument } from "@/components/clients/client-documents-card";
import { EditClientSheet } from "@/components/clients/edit-client-sheet";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { Download, Edit, User } from "lucide-react";
import type { ClientFormValues } from "@/app/(app)/clients/actions";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Client details • Lawyer Diary",
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
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

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(
      "id, type, name, full_name, father_name, representation, representative_details, organization_name, email, phone, address, city, province, country, cnic, notes",
    )
    .eq("firm_id", profile.firm_id)
    .eq("id", id)
    .maybeSingle();

  if (clientError) {
    console.error("Error fetching client:", {
      message: clientError.message,
      details: clientError.details,
      hint: clientError.hint,
      code: clientError.code,
    });
    notFound();
  }

  if (!client) {
    notFound();
  }

  // Type assertion needed due to TypeScript type inference issues
  const clientData = client as unknown as { id: string; [key: string]: unknown };

  // Fetch related matters separately to avoid nested query issues
  const { data: matters, error: mattersError } = await supabase
    .from("matters")
    .select("id, serial_number, matter_status, matter_type, case_number, court_name, district")
    .eq("firm_id", profile.firm_id)
    .eq("client_id", clientData.id)
    .order("created_at", { ascending: false });

  if (mattersError) {
    console.error("Error fetching matters:", {
      message: mattersError.message,
      details: mattersError.details,
      hint: mattersError.hint,
      code: mattersError.code,
    });
    // Don't fail the page if matters can't be fetched, just log the error
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("id, file_name, storage_path, uploaded_by, created_at, metadata")
    .eq("firm_id", profile.firm_id)
    .order("created_at", { ascending: false })
    .limit(50);

  const clientDocuments: ClientDocument[] =
    documents
      ?.filter((doc) => {
        const meta = (doc.metadata as any) ?? {};
        return meta.kind === "client_document" && meta.clientId === clientData.id;
      })
      .map((doc) => ({
        id: doc.id,
        fileName: doc.file_name,
        storagePath: doc.storage_path,
        createdAt: doc.created_at,
        uploadedBy: doc.uploaded_by,
      })) ?? [];

  const statusLabel = new Map(matterStatusOptions.map((option) => [option.value, option.label]));
  const representativeDetails = clientData.representative_details as
    | { to_whom?: string | null; capacity?: string | null }
    | null
    | undefined;

  // Convert client data to form values
  const clientFormValues: ClientFormValues = {
    id: clientData.id,
    type: clientData.type as "individual" | "organization",
    fullName: (clientData.full_name as string | null | undefined) ?? (clientData.name as string | null | undefined) ?? "",
    fatherName: (clientData.father_name as string | null | undefined) ?? "",
    organizationName: (clientData.organization_name as string | null | undefined) ?? "",
    email: (clientData.email as string | null | undefined) ?? "",
    phone: (clientData.phone as string | null | undefined) ?? "",
    cnic: (clientData.cnic as string | null | undefined) ?? "",
    address: (clientData.address as string | null | undefined) ?? "",
    city: (clientData.city as string | null | undefined) ?? "",
    province: (clientData.province as string | null | undefined) ?? "",
    country: (clientData.country as string | null | undefined) ?? "Pakistan",
    notes: (clientData.notes as string | null | undefined) ?? "",
    representation: clientData.representation as "self" | "representative",
    representativeToWhom: representativeDetails?.to_whom ?? "",
    representativeCapacity: representativeDetails?.capacity as any ?? "",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-xl backdrop-blur">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Client Profile</p>
                <h1 className="text-3xl font-bold text-foreground">{(clientData.full_name as string | null | undefined) ?? (clientData.name as string | null | undefined) ?? "Unnamed Client"}</h1>
                {(() => {
                  const orgName = clientData.organization_name;
                  return orgName && typeof orgName === "string" ? (
                    <p className="mt-1 text-sm text-muted-foreground">{orgName}</p>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize text-sm font-medium">
                {clientData.type as string}
              </Badge>
              <EditClientSheet client={clientFormValues} />
              <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                <a href={`/api/clients/${clientData.id}/pdf`} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Download className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Download PDF</span>
                </a>
              </Button>
              <DeleteClientButton
                clientId={clientData.id}
                clientName={(clientData.full_name as string) ?? (clientData.name as string) ?? "Client"}
                size="sm"
              />
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Contact & Identity</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Background information shared with your team, including representation capacity.
              </p>
            </div>
            <EditClientSheet client={clientFormValues} />
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Father / Guardian" value={clientData.father_name as string | null} />
            <DetailItem label="Representation" value={clientData.representation as string | null} />
            <DetailItem
              label="Represents"
              value={representativeDetails?.to_whom ?? null}
            />
            <DetailItem
              label="Capacity"
              value={representativeDetails?.capacity ?? null}
            />
            <DetailItem label="Email" value={clientData.email as string | null} />
            <DetailItem label="Phone" value={clientData.phone as string | null} />
            <DetailItem label="City" value={clientData.city as string | null} />
            <DetailItem label="Province" value={clientData.province as string | null} />
            <DetailItem label="Country" value={clientData.country as string | null} />
            <DetailItem label="CNIC / ID" value={clientData.cnic as string | null} />
          </div>
          <DetailItem label="Address" value={clientData.address as string | null} fullWidth />
          <DetailItem label="Notes" value={clientData.notes as string | null} fullWidth />
        </div>
      </div>

      <ClientDocumentsCard clientId={clientData.id} documents={clientDocuments} />

      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <h2 className="text-lg font-semibold text-foreground">Related matters</h2>
            <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
              <Link href="/cases" className="flex items-center gap-2">
                <span className="whitespace-nowrap">Go to matters</span>
              </Link>
            </Button>
          </div>
          <Separator />
          {matters && matters.length > 0 ? (
            <div className="space-y-3">
              {matters.map((matter) => (
                <article key={matter.id} className="sap-tile space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Serial {matter.serial_number}
                      </p>
                      <h3 className="text-base font-semibold text-foreground">
                        {matter.court_name ?? "Court pending"}
                      </h3>
                    </div>
                    <Badge variant="outline">
                      {statusLabel.get(matter.matter_status) ?? matter.matter_status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    {matter.case_number ? <span>Case #: {matter.case_number}</span> : null}
                    {matter.district ? <span>District: {matter.district}</span> : null}
                    <span>Type: {matter.matter_type}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="sap-subtle">
              <p className="font-medium text-foreground">No matters linked yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a matter and tie it to this client from the matters page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={fullWidth ? "md:col-span-2" : undefined}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

