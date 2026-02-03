"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { deleteTeamMember } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";

type DeleteTeamMemberButtonProps = {
  member: {
    id: string;
    name: string;
    email: string;
  };
  currentUserId: string;
  firmOwnerId: string | null;
};

export function DeleteTeamMemberButton({
  member,
  currentUserId,
  firmOwnerId,
}: DeleteTeamMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isOwner = member.id === firmOwnerId;
  const isCurrentUser = member.id === currentUserId;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTeamMember(member.id);

      if (result.success) {
        toast({
          title: "Team Member Removed",
          description: result.message || "Team member has been removed successfully.",
          variant: "success",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete team member.",
          variant: "destructive",
        });
      }
    });
  };

  if (isOwner || isCurrentUser) {
    return null; // Don't show delete button for owner or current user
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto min-w-0 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 shrink-0" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{member.name}</strong> ({member.email}) from
            your firm? This action cannot be undone and will permanently delete their account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                <span className="truncate">Removing...</span>
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Remove</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
