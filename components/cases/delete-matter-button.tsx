"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteMatter } from "@/app/(app)/cases/[id]/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type DeleteMatterButtonProps = {
  matterId: string;
  matterSerial: string;
  variant?: "default" | "destructive" | "outline" | "ghost" | "link" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function DeleteMatterButton({
  matterId,
  matterSerial,
  variant = "destructive",
  size = "sm",
  className,
}: DeleteMatterButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteMatter(matterId);
      if (result.success) {
        setOpen(false);
        toast({
          title: "Matter deleted",
          description: `Matter ${matterSerial} has been successfully deleted.`,
          variant: "success",
        });
        router.refresh();
        router.push("/cases");
      } else {
        const errorMsg = result.message || "Failed to delete matter";
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
        title="Delete Matter"
        description={`Are you sure you want to delete matter "${matterSerial}"? This will permanently delete the matter, all associated hearings, and documents. This action cannot be undone. If this matter has associated invoices, you will need to remove or reassign them first.`}
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
