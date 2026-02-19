 "use client";

import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadClientDocument, getSignedClientDocumentUrl } from "@/app/(app)/clients/actions";
import { Loader2, Download, Camera, Upload as UploadIcon } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    
    // Check if file was actually captured/selected
    if (!file) {
      // Only show error if input had a value (user tried to select)
      if (input.value) {
        setError("No file captured. Please try taking the photo again.");
        input.value = ""; // Reset input
      }
      setSelectedFile(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError(`File size exceeds 10MB limit. Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      input.value = ""; // Reset input
      setSelectedFile(null);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      setError("Invalid file type. Please select an image (JPG, PNG, WebP) or PDF file.");
      input.value = ""; // Reset input
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    
    if (!selectedFile) {
      setError("Select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("clientId", clientId);

    startTransition(async () => {
      try {
        const result = await uploadClientDocument(formData);
        if (!result.success) {
          setError(result.message ?? "Unable to upload document. Please try again or contact support at /contact if the issue persists.");
          return;
        }
        // Reset both file inputs
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (cameraInputRef.current) {
          cameraInputRef.current.value = "";
        }
        formRef.current?.reset();
        setSelectedFile(null);
        setError(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to upload document. Please try again.");
      }
    });
  };

  const triggerFileInput = () => {
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    fileInputRef.current?.click();
  };

  const triggerCameraInput = () => {
    // Reset input to allow capturing again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    cameraInputRef.current?.click();
  };

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 p-4"
      onSubmit={handleSubmit}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        onClick={(e) => {
          // Reset value on click to ensure onChange fires even if same file is selected
          const target = e.target as HTMLInputElement;
          target.value = "";
        }}
      />

      {/* Upload options */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          className="flex-1 h-11 sm:h-10 text-base sm:text-sm"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          Choose File
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={triggerCameraInput}
          className="flex-1 h-11 sm:h-10 text-base sm:text-sm"
        >
          <Camera className="mr-2 h-4 w-4" />
          Take Photo
        </Button>
      </div>

      {/* Selected file display */}
      {selectedFile && (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          <p className="font-medium text-foreground">Selected: {selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      {/* Upload button and info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground flex-1">
          Upload CNIC scans, certificates, engagement letters, or other KYC files.
        </p>
        <Button 
          type="submit" 
          size="sm" 
          disabled={isPending || !selectedFile}
          className="w-full sm:w-auto h-10 sm:h-9 text-base sm:text-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
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
            try {
              const result = await getSignedClientDocumentUrl(documentId);
              if (!result.success || !result.url) {
                setError(result.message ?? "Unable to generate download link. Please try again or contact support at /contact if the issue persists.");
                return;
              }
              window.open(result.url, "_blank", "noopener,noreferrer");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to generate download link. Please try again.");
            }
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


