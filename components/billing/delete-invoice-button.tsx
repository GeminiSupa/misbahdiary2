"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteInvoice, voidInvoice } from "@/app/(app)/billing/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type DeleteInvoiceButtonProps = {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  variant?: "default" | "destructive" | "outline" | "ghost" | "link" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function DeleteInvoiceButton({
  invoiceId,
  invoiceNumber,
  status,
  variant = "destructive",
  size = "sm",
  className,
}: DeleteInvoiceButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if (result.success) {
        setOpen(false);
        toast({
          title: "Invoice deleted",
          description: `Invoice ${invoiceNumber} has been successfully deleted.`,
          variant: "success",
        });
        router.refresh();
      } else {
        const errorMsg = result.message || "Failed to delete invoice";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    });
  };

  // Only show delete for draft invoices
  if (status !== "draft") {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        disabled={isPending}
        className={`w-full sm:w-auto min-w-0 ${className || ""}`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate hidden sm:inline">Delete</span>
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice "${invoiceNumber}"? This action cannot be undone. Associated time entries will be unlinked.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

export function VoidInvoiceButton({
  invoiceId,
  invoiceNumber,
  status,
  variant = "outline",
  size = "sm",
  className,
}: DeleteInvoiceButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVoid = () => {
    setError(null);
    startTransition(async () => {
      const result = await voidInvoice(invoiceId);
      if (result.success) {
        setOpen(false);
        toast({
          title: "Invoice voided",
          description: `Invoice ${invoiceNumber} has been voided.`,
          variant: "success",
        });
        router.refresh();
      } else {
        const errorMsg = result.message || "Failed to void invoice";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    });
  };

  // Only show void for non-draft, non-void invoices
  if (status === "draft" || status === "void") {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        disabled={isPending}
        className={`w-full sm:w-auto min-w-0 ${className || ""}`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate hidden sm:inline">Void</span>
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleVoid}
        title="Void Invoice"
        description={`Are you sure you want to void invoice "${invoiceNumber}"? This will mark the invoice as void and it cannot be undone. The invoice will remain in the system for record-keeping purposes.`}
        confirmText="Void Invoice"
        cancelText="Cancel"
        variant="destructive"
      />

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
