"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[95vw] max-w-md sm:max-w-lg">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 mt-4">
          <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto order-1 sm:order-2" : "w-full sm:w-auto order-1 sm:order-2"}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
