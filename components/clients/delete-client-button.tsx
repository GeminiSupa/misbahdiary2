"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteClient } from "@/app/(app)/clients/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DeleteClientButtonProps = {
  clientId: string;
  clientName: string;
  variant?: "default" | "destructive" | "outline" | "ghost" | "link" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function DeleteClientButton({
  clientId,
  clientName,
  variant = "destructive",
  size = "sm",
  className,
}: DeleteClientButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteClient(clientId);
      if (result.success) {
        setOpen(false);
        toast({
          title: "Client deleted",
          description: `${clientName} has been successfully deleted.`,
          variant: "success",
        });
        router.refresh();
        router.push("/clients");
      } else {
        const errorMsg = result.message || "Failed to delete client";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        disabled={isPending}
        className={className}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        <span className="ml-2 hidden sm:inline">Delete</span>
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        title="Delete Client"
        description={`Are you sure you want to delete "${clientName}"? This action cannot be undone. If this client has associated matters or invoices, you will need to remove or reassign them first.`}
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
