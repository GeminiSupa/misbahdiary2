"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateTeamMember } from "@/app/(app)/settings/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Pencil, Shield, User } from "lucide-react";

const updateTeamMemberSchema = z.object({
  teamMemberId: z.string().uuid(),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum([
    "principal_partner",
    "associate",
    "paralegal",
    "of_counsel",
    "client",
    "staff",
  ]),
});

type EditTeamMemberSheetProps = {
  member: {
    id: string;
    name: string;
    email: string;
    role: string | null;
  };
  trigger?: React.ReactNode;
  currentUserId: string;
  firmOwnerId: string | null;
};

export function EditTeamMemberSheet({
  member,
  trigger,
  currentUserId,
  firmOwnerId,
}: EditTeamMemberSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof updateTeamMemberSchema>>({
    resolver: zodResolver(updateTeamMemberSchema),
    defaultValues: {
      teamMemberId: member.id,
      fullName: member.name,
      role: (member.role as z.infer<typeof updateTeamMemberSchema>["role"]) || "associate",
    },
  });

  const isOwner = member.id === firmOwnerId;
  const isCurrentUser = member.id === currentUserId;

  const onSubmit = (values: z.infer<typeof updateTeamMemberSchema>) => {
    startTransition(async () => {
      const result = await updateTeamMember(values);

      if (result.success) {
        toast({
          title: "Team Member Updated",
          description: result.message || "Team member has been updated successfully.",
          variant: "success",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update team member.",
          variant: "destructive",
        });
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([key, messages]) => {
            const message = messages?.[0];
            if (message) {
              form.setError(key as keyof typeof values, {
                type: "server",
                message,
              });
            }
          });
        }
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Edit Team Member</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update team member information and role
              </p>
            </div>
          </div>
        </SheetHeader>
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Role
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isOwner}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="principal_partner">Principal Partner</SelectItem>
                        <SelectItem value="associate">Associate</SelectItem>
                        <SelectItem value="of_counsel">Of Counsel</SelectItem>
                        <SelectItem value="paralegal">Paralegal</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isOwner
                        ? "The firm owner must remain a Principal Partner."
                        : "This determines what the user can see and do in the system."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Email:</strong> {member.email}
                </p>
                {isOwner && (
                  <p className="text-xs text-amber-600 mt-1">
                    This is the firm owner. Their role cannot be changed.
                  </p>
                )}
                {isCurrentUser && (
                  <p className="text-xs text-blue-600 mt-1">
                    This is your account. You cannot change your own role.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || isOwner} className="flex-1 gap-2">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      Update
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
