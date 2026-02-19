"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createInvitation, revokeInvitation } from "@/app/(app)/settings/actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invitationFormSchema, type InvitationFormSchema } from "@/lib/validation/settings";
import { useToast } from "@/hooks/use-toast";

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string | null;
};

type InviteManagerProps = {
  invitations: Invitation[];
  canInvite?: boolean;
};

export function InviteManager({ invitations, canInvite = true }: InviteManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: "",
      role: "associate" as const,
    },
  });

  const onSubmit = async (values: InvitationFormSchema) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await createInvitation({
      email: values.email,
      role: values.role,
    });

    if (result.success) {
      form.reset({ email: "", role: "associate" });
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${values.email}. They will receive an email with the invitation link.`,
        variant: "success",
      });
      router.refresh();
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as "email" | "role", {
            type: "server",
            message,
          });
        }
      });
    }

    if (result.message) {
      setFormError(result.message);
    }

    setIsSubmitting(false);
  };

  const handleRevoke = async (invitationId: string) => {
    const result = await revokeInvitation(invitationId);
    if (result.success) {
      toast({
        title: "Invitation revoked",
        description: "The invitation has been successfully revoked.",
        variant: "success",
      });
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to revoke invitation",
        variant: "destructive",
      });
    }
    router.refresh();
  };

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-3 sm:space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Team Invitations</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Send secure invitation links to add team members
          </p>
        </div>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to send invitation</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {!canInvite ? (
          <Alert>
            <AlertTitle>Permission Required</AlertTitle>
            <AlertDescription>
              Only Firm Owners and Principal Partners can send invitations to add new team members. Contact the Firm Owner to request access.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-[2fr_1fr] md:grid-cols-[2fr_1fr_auto]">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="colleague@lawfirm.pk" className="min-h-[44px] sm:min-h-[40px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="block w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base sm:text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] sm:min-h-[40px]"
                      >
                        <option value="principal_partner">Principal / Partner</option>
                        <option value="associate">Associate</option>
                        <option value="paralegal">Paralegal</option>
                        <option value="of_counsel">Of Counsel</option>
                        <option value="staff">Staff</option>
                        <option value="client">Client</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end sm:col-span-2 md:col-span-1">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : null}
                  <span className="whitespace-nowrap">Send invite</span>
                </Button>
              </div>
            </form>
          </Form>
        )}

        <div className="rounded-2xl border border-border/60 bg-background/70 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length > 0 ? (
                  invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell className="capitalize">{invite.role.replace("_", " ")}</TableCell>
                      <TableCell className="capitalize">{invite.status}</TableCell>
                      <TableCell>{new Date(invite.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}</TableCell>
                      <TableCell>
                        {invite.status === "pending" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(invite.id)}
                            className="min-h-[44px] sm:min-h-[40px]"
                          >
                            Revoke
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      No invitations sent yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            {invitations.length > 0 ? (
              invitations.map((invite) => (
                <div key={invite.id} className="rounded-lg border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{invite.email}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {invite.role.replace("_", " ")}
                      </p>
                    </div>
                    <span className="text-xs font-medium capitalize px-2 py-1 rounded bg-muted text-muted-foreground shrink-0">
                      {invite.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">
                      Sent: {new Date(invite.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </span>
                    {invite.status === "pending" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(invite.id)}
                        className="min-h-[44px] text-xs"
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No invitations sent yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
