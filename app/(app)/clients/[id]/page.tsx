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

  // Fetch related matters separately to avoid nested query issues
  const { data: matters, error: mattersError } = await supabase
    .from("matters")
    .select("id, serial_number, matter_status, matter_type, case_number, court_name, district")
    .eq("firm_id", profile.firm_id)
    .eq("client_id", client.id)
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
        return meta.kind === "client_document" && meta.clientId === client.id;
      })
      .map((doc) => ({
        id: doc.id,
        fileName: doc.file_name,
        storagePath: doc.storage_path,
        createdAt: doc.created_at,
        uploadedBy: doc.uploaded_by,
      })) ?? [];

  const statusLabel = new Map(matterStatusOptions.map((option) => [option.value, option.label]));
  const representativeDetails = client.representative_details as
    | { to_whom?: string | null; capacity?: string | null }
    | null
    | undefined;

  // Convert client data to form values
  const clientFormValues: ClientFormValues = {
    id: client.id,
    type: client.type as "individual" | "organization",
    fullName: client.full_name ?? client.name ?? "",
    fatherName: client.father_name ?? "",
    organizationName: client.organization_name ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    cnic: client.cnic ?? "",
    address: client.address ?? "",
    city: client.city ?? "",
    province: client.province ?? "",
    country: client.country ?? "Pakistan",
    notes: client.notes ?? "",
    representation: client.representation as "self" | "representative",
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
                <h1 className="text-3xl font-bold text-foreground">{client.full_name ?? client.name}</h1>
                {client.organization_name && (
                  <p className="mt-1 text-sm text-muted-foreground">{client.organization_name}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize text-sm font-medium">
                {client.type}
              </Badge>
              <EditClientSheet client={clientFormValues} />
              <Button asChild size="sm" variant="outline">
                <a href={`/api/clients/${client.id}/pdf`} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
              <DeleteClientButton
                clientId={client.id}
                clientName={client.full_name ?? client.name ?? "Client"}
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
            <DetailItem label="Father / Guardian" value={client.father_name} />
            <DetailItem label="Representation" value={client.representation} />
            <DetailItem
              label="Represents"
              value={representativeDetails?.to_whom ?? null}
            />
            <DetailItem
              label="Capacity"
              value={representativeDetails?.capacity ?? null}
            />
            <DetailItem label="Email" value={client.email} />
            <DetailItem label="Phone" value={client.phone} />
            <DetailItem label="City" value={client.city} />
            <DetailItem label="Province" value={client.province} />
            <DetailItem label="Country" value={client.country} />
            <DetailItem label="CNIC / ID" value={client.cnic} />
          </div>
          <DetailItem label="Address" value={client.address} fullWidth />
          <DetailItem label="Notes" value={client.notes} fullWidth />
        </div>
      </div>

      <ClientDocumentsCard clientId={client.id} documents={clientDocuments} />

      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <h2 className="text-lg font-semibold text-foreground">Related matters</h2>
            <Button asChild size="sm" variant="secondary">
              <Link href="/cases">Go to matters</Link>
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

