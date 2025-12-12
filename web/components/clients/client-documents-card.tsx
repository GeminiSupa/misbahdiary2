 "use client";

import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadClientDocument, getSignedClientDocumentUrl } from "@/app/(app)/clients/actions";
import { Loader2, Download } from "lucide-react";

export type ClientDocument = {
  id: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
  uploadedBy?: string | null;
};

type ClientDocumentsCardProps = {
  clientId: string;
  documents: ClientDocument[];
};

export function ClientDocumentsCard({ clientId, documents }: ClientDocumentsCardProps) {
  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Client documents</h2>
            <p className="text-sm text-muted-foreground">
              Store KYC, identity documents, engagement letters, and certificates for this client.
            </p>
          </div>
        </div>

        <ClientDocumentUploader clientId={clientId} />

        {documents.length === 0 ? (
          <div className="sap-subtle">
            <p className="text-sm text-muted-foreground">
              No client-level documents have been added yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="break-all font-medium text-foreground">{doc.fileName}</p>
                    <p className="break-all text-xs text-muted-foreground">{doc.storagePath}</p>
                  </div>
                  <ClientDocumentDownloadButton documentId={doc.id} />
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

type ClientDocumentUploaderProps = {
  clientId: string;
};

function ClientDocumentUploader({ clientId }: ClientDocumentUploaderProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);
        formData.append("clientId", clientId);
        const file = formData.get("file");
        if (!(file instanceof File) || file.size === 0) {
          setError("Select a file before uploading.");
          return;
        }
        startTransition(async () => {
          const result = await uploadClientDocument(formData);
          if (!result.success) {
            setError(result.message ?? "Unable to upload document.");
            return;
          }
          formRef.current?.reset();
          setError(null);
          router.refresh();
        });
      }}
    >
      <Input name="file" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx" />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Upload CNIC scans, certificates, engagement letters, or other KYC files.</span>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Upload
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}

type ClientDocumentDownloadButtonProps = {
  documentId: string;
};

function ClientDocumentDownloadButton({ documentId }: ClientDocumentDownloadButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await getSignedClientDocumentUrl(documentId);
            if (!result.success || !result.url) {
              setError(result.message ?? "Unable to generate download link.");
              return;
            }
            window.open(result.url, "_blank", "noopener,noreferrer");
          });
        }}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download
      </Button>
      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
    </div>
  );
}


