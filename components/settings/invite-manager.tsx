// @ts-nocheck

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
import { invitationFormSchema } from "@/lib/validation/settings";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: "",
      role: "associate" as const,
    },
  });

  const onSubmit = async (values: { email: string; role: string }) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await createInvitation({
      email: values.email,
      role: values.role as typeof values.role,
    });

    if (result.success) {
      form.reset({ email: "", role: "associate" });
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
    await revokeInvitation(invitationId);
    router.refresh();
  };

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team invitations</h2>
          <p className="text-sm text-muted-foreground">
            Invite colleagues to join your workspace. Generate secure, one-time links for each role.
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
              Only Principal Partners can send invitations to add new team members.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="colleague@lawfirm.pk" />
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
                        className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send invite
                </Button>
              </div>
            </form>
          </Form>
        )}

        <div className="rounded-2xl border border-border/60 bg-background/70">
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
                    <TableCell>{new Date(invite.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {invite.status === "pending" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(invite.id)}
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
      </div>
    </div>
  );
}
