import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { matterStatusOptions } from "@/lib/constants/cases";
import { ClientDocumentsCard, type ClientDocument } from "@/components/clients/client-documents-card";

type ClientDetailPageProps = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: "Client details • Lawyer Diary",
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
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

  const { data: client } = await supabase
    .from("clients")
    .select(
      `
        id,
        type,
        name,
        full_name,
        father_name,
        representation,
        representative_details,
        organization_name,
        email,
        phone,
        address,
        city,
        province,
        country,
        cnic,
        notes,
        matters:matters (
          id,
          serial_number,
          matter_status,
          matter_type,
          case_number,
          court_name,
          district
        )
      `,
    )
    .eq("firm_id", profile.firm_id)
    .eq("id", params.id)
    .maybeSingle();

  if (!client) {
    notFound();
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

  return (
    <div className="flex flex-col gap-6">
      <div className="sap-card">
        <div className="sap-card-body space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Client profile</p>
              <h1 className="text-3xl font-semibold text-foreground">{client.full_name ?? client.name}</h1>
            </div>
            <Badge variant="outline" className="capitalize">
              {client.type}
            </Badge>
          </div>
          {client.organization_name ? (
            <p className="text-sm text-muted-foreground">{client.organization_name}</p>
          ) : null}
        </div>
      </div>

      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Contact & identity</h2>
              <p className="text-sm text-muted-foreground">
                Background information shared with your team, including representation capacity.
              </p>
            </div>
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
          {client.matters && client.matters.length > 0 ? (
            <div className="space-y-3">
              {client.matters.map((matter) => (
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

