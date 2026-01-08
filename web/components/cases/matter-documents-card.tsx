import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { MatterDocumentUploader, DocumentDownloadButton } from "@/components/cases/matter-document-uploader";
import { FileText, Upload, Download, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="sap-card-body space-y-6">
        <div className="sap-card-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Matter Documents</h2>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Reference evidence, briefs, and filings captured for this matter.
            </p>
          </div>
        </div>

        <MatterDocumentUploader matterId={matterId} />

        {documents.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-6 text-center sm:p-8">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2 sm:h-12 sm:w-12 sm:mb-3" />
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">No documents have been added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="space-y-3">
                <article className="group rounded-xl border-2 border-border/60 bg-gradient-to-br from-background/80 to-background/60 px-5 py-4 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground break-words">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground break-all mt-1">{doc.storagePath}</p>
                      </div>
                    </div>
                    <DocumentDownloadButton documentId={doc.id} />
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Uploaded {format(new Date(doc.createdAt), "dd MMM yyyy")}</span>
                    </div>
                    {doc.uploadedBy && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>By <span className="font-semibold text-foreground">{doc.uploadedBy}</span></span>
                      </div>
                    )}
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
