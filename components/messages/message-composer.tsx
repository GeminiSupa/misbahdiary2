"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/app/(app)/messages/actions";
import { Loader2, Send, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const messageSchema = z.object({
  recipient_id: z.string().optional(),
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message is too long"),
  is_group: z.boolean().default(false),
});

type MessageFormValues = z.infer<typeof messageSchema>;

type TeamMember = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type ClientRecipient = {
  id: string;
  full_name: string | null;
};

type MessageComposerProps = {
  teamMembers: TeamMember[];
  clients: ClientRecipient[];
  currentUserId: string;
  firmId: string;
};

export function MessageComposer({
  teamMembers,
  clients,
  currentUserId,
  firmId,
}: MessageComposerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isGroup, setIsGroup] = useState(false);

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipient_id: "",
      content: "",
      is_group: false,
    },
  });

  const onSubmit = (values: MessageFormValues) => {
    startTransition(async () => {
      const rawRecipient = values.recipient_id || "";

      const isClientRecipient = rawRecipient.startsWith("client:");
      const isTeamRecipient = rawRecipient.startsWith("team:");

      if (!isGroup && !rawRecipient) {
        toast({
          title: "Select a recipient",
          description: "Choose a team member or client first.",
          variant: "destructive",
        });
        return;
      }

      const content = values.content;

      if (!isGroup && isClientRecipient) {
        const clientId = rawRecipient.replace(/^client:/, "");
        const res = await fetch(`/api/lawyer/clients/${clientId}/portal-messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lawyerProfileId: currentUserId,
            content,
          }),
        });

        const json = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          toast({
            title: "Error",
            description: json.message || "Failed to send message to client.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Message sent",
          description: "Your message has been sent to the client.",
        });
        form.reset();
        setIsGroup(false);
        router.refresh();
        return;
      }

      const recipientId =
        isGroup ? null : isTeamRecipient ? rawRecipient.replace(/^team:/, "") : rawRecipient;

      const result = await sendMessage({
        firmId,
        recipientId,
        content,
      });

      if (result.success) {
        toast({
          title: "Message sent",
          description: isGroup
            ? "Your message has been sent to all team members"
            : "Your message has been sent",
        });
        form.reset();
        setIsGroup(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send message",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="group-message"
          checked={isGroup}
          onCheckedChange={(checked) => {
            setIsGroup(checked as boolean);
            if (checked) {
              form.setValue("recipient_id", "");
            }
          }}
        />
        <Label
          htmlFor="group-message"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Send to all team members
        </Label>
      </div>

      {!isGroup && (
        <div className="space-y-2">
          <Label htmlFor="recipient">Send to</Label>
          <Select
            value={form.watch("recipient_id")}
            onValueChange={(value) => form.setValue("recipient_id", value)}
            disabled={isPending}
          >
            <SelectTrigger id="recipient">
              <SelectValue placeholder="Select team member or client" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                Team
              </div>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={`team:${member.id}`}>
                  {member.full_name || "Unknown"} ({member.role || "No role"})
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                Clients
              </div>
              {clients.map((client) => (
                <SelectItem key={client.id} value={`client:${client.id}`}>
                  {client.full_name || "Unnamed client"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.recipient_id && (
            <p className="text-sm text-destructive">
              {form.formState.errors.recipient_id.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="content">Message</Label>
        <Textarea
          id="content"
          {...form.register("content")}
          placeholder={isGroup ? "Type your message to all team members..." : "Type your message..."}
          rows={6}
          disabled={isPending}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          {form.formState.errors.content && (
            <p className="text-sm text-destructive">
              {form.formState.errors.content.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground ml-auto">
            {form.watch("content")?.length || 0} / 5000 characters
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4 shrink-0" />
            <span>Send Message</span>
          </>
        )}
      </Button>
    </form>
  );
}
