"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { uploadMatterDocument, getSignedMatterDocumentUrl } from "@/app/(app)/cases/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download } from "lucide-react";

type MatterDocumentUploaderProps = {
  matterId: string;
  /**
   * Optional: when provided, this upload will be treated as a
   * hearing-specific document (typically a hearing order).
   */
  hearingId?: string;
};

type DocumentDownloadButtonProps = {
  documentId: string;
};

export function MatterDocumentUploader({ matterId, hearingId }: MatterDocumentUploaderProps) {
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
        formData.append("matterId", matterId);
        if (hearingId) {
          formData.append("hearingId", hearingId);
        }
        const file = formData.get("file");
        if (!(file instanceof File) || file.size === 0) {
          setError("Select a file before uploading.");
          return;
        }
        startTransition(async () => {
          const result = await uploadMatterDocument(formData);
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
        <span>PDF, Office, or image files. Max size limited by bucket policy.</span>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Upload
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}

export function DocumentDownloadButton({ documentId }: DocumentDownloadButtonProps) {
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
            const result = await getSignedMatterDocumentUrl(documentId);
            if (!result.success || !result.url) {
              setError(result.message ?? "Unable to generate download link.");
              return;
            }
            window.open(result.url, "_blank", "noopener,noreferrer");
          });
        }}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} 
        Download
      </Button>
      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
    </div>
  );
}
