import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { MatterDocumentUploader, DocumentDownloadButton } from "@/components/cases/matter-document-uploader";

export type MatterDocument = {
  id: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
  uploadedBy?: string | null;
};

type MatterDocumentsCardProps = {
  matterId: string;
  documents: MatterDocument[];
};

export function MatterDocumentsCard({ matterId, documents }: MatterDocumentsCardProps) {
  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Matter documents</h2>
            <p className="text-sm text-muted-foreground">
              Reference evidence, briefs, and filings captured for this matter.
            </p>
          </div>
        </div>

        <MatterDocumentUploader matterId={matterId} />

        {documents.length === 0 ? (
          <div className="sap-subtle">
            <p className="text-sm text-muted-foreground">No documents have been added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <article key={doc.id} className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground break-all">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground break-all">{doc.storagePath}</p>
                  </div>
                  <DocumentDownloadButton documentId={doc.id} />
                </div>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Uploaded {format(new Date(doc.createdAt), "dd MMM yyyy")}</span>
                  {doc.uploadedBy ? <span>By {doc.uploadedBy}</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
