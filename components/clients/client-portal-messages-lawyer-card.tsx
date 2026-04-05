"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare } from "lucide-react";

type LawyerOption = { id: string; full_name: string | null; role: string | null };

type MessageRow = {
  id: string;
  lawyer_profile_id: string;
  sender_auth_user_id: string;
  content: string;
  created_at: string;
};

type ClientPortalMessagesLawyerCardProps = {
  clientId: string;
  lawyers: LawyerOption[];
  currentUserId: string;
  clientAuthUserId: string | null;
};

export function ClientPortalMessagesLawyerCard({
  clientId,
  lawyers,
  currentUserId,
  clientAuthUserId,
}: ClientPortalMessagesLawyerCardProps) {
  const [threadLawyerId, setThreadLawyerId] = useState<string>(lawyers[0]?.id ?? "");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadLawyerId && lawyers[0]?.id) {
      setThreadLawyerId(lawyers[0].id);
    }
  }, [lawyers, threadLawyerId]);

  const loadMessages = useCallback(async () => {
    if (!threadLawyerId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/lawyer/clients/${clientId}/portal-messages?lawyerProfileId=${encodeURIComponent(threadLawyerId)}`,
        { cache: "no-store" },
      );
      const json = (await res.json().catch(() => ({}))) as { data?: MessageRow[]; message?: string };
      if (!res.ok) throw new Error(json.message || "Could not load messages.");
      setMessages(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [clientId, threadLawyerId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const sendReply = async () => {
    const text = content.trim();
    if (!threadLawyerId || !text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/lawyer/clients/${clientId}/portal-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawyerProfileId: threadLawyerId, content: text }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(json.message || "Could not send.");
      setContent("");
      await loadMessages();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setSending(false);
    }
  };

  if (lawyers.length === 0) {
    return (
      <div className="sap-card">
        <div className="sap-card-body">
          <p className="text-sm text-muted-foreground">
            Add team members to your firm to exchange portal messages with this client.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Client portal messages</h2>
              <p className="text-sm text-muted-foreground">
                Thread by lawyer the client chose. You can reply on behalf of your firm.
              </p>
            </div>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="space-y-2">
          <label className="text-sm font-medium">Thread (lawyer)</label>
          <Select value={threadLawyerId} onValueChange={setThreadLawyerId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select thread" />
            </SelectTrigger>
            <SelectContent>
              {lawyers.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.full_name?.trim() || l.id.slice(0, 8)}
                  {l.role ? ` (${l.role.replace(/_/g, " ")})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
          {loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages in this thread yet.</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_auth_user_id === currentUserId;
              const fromClient =
                Boolean(clientAuthUserId) && m.sender_auth_user_id === clientAuthUserId;
              const label = mine ? "You" : fromClient ? "Client" : "Team";
              return (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    mine
                      ? "ml-8 bg-primary text-primary-foreground"
                      : "mr-8 bg-card border border-border"
                  }`}
                >
                  <p className="text-xs opacity-80 mb-1">
                    {label} · {new Date(m.created_at).toLocaleString()}
                  </p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              );
            })
          )}
        </div>

        <Textarea
          placeholder="Reply to the client…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          disabled={sending || !threadLawyerId}
          className="resize-none"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => void sendReply()}
          disabled={sending || !content.trim() || !threadLawyerId}
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            "Send reply"
          )}
        </Button>
      </div>
    </div>
  );
}
