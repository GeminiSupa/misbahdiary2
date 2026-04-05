"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Loader2 } from "lucide-react";

type LawyerOption = { id: string; full_name: string | null; role: string };

type MessageRow = {
  id: string;
  lawyer_profile_id: string;
  sender_auth_user_id: string;
  content: string;
  created_at: string;
};

export function ClientMessagesPanel() {
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [lawyerId, setLawyerId] = useState<string>("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loadingLawyers, setLoadingLawyers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLawyers = useCallback(async () => {
    setLoadingLawyers(true);
    setError(null);
    try {
      const res = await fetch("/api/client/lawyers", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as {
        data?: LawyerOption[];
        message?: string;
      };
      if (!res.ok) throw new Error(json.message || "Could not load lawyers.");
      const list = json.data ?? [];
      setLawyers(list);
      setLawyerId((prev) => {
        if (prev && list.some((l) => l.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoadingLawyers(false);
    }
  }, []);

  const loadMessages = useCallback(async (lid: string) => {
    if (!lid) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/client/messages?lawyerProfileId=${encodeURIComponent(lid)}`,
        { cache: "no-store" },
      );
      const json = (await res.json().catch(() => ({}))) as {
        data?: MessageRow[];
        currentUserId?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(json.message || "Could not load messages.");
      setMessages(json.data ?? []);
      if (json.currentUserId) setCurrentUserId(json.currentUserId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadLawyers();
  }, [loadLawyers]);

  useEffect(() => {
    if (lawyerId) void loadMessages(lawyerId);
    else setMessages([]);
  }, [lawyerId, loadMessages]);

  const handleSend = async () => {
    const text = content.trim();
    if (!lawyerId || !text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/client/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawyerProfileId: lawyerId, content: text }),
      });
      const json = (await res.json().catch(() => ({}))) as { data?: MessageRow; message?: string };
      if (!res.ok) throw new Error(json.message || "Could not send message.");
      setContent("");
      await loadMessages(lawyerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setSending(false);
    }
  };

  const titleForLawyer = lawyers.find((x) => x.id === lawyerId)?.full_name?.trim() || "your lawyer";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Send a note to a lawyer at your firm. They can reply here when they are logged in.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>Choose who to message, then type below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingLawyers ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </p>
          ) : lawyers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lawyers are available to message yet.</p>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Lawyer</label>
              <Select value={lawyerId} onValueChange={setLawyerId}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select lawyer" />
                </SelectTrigger>
                <SelectContent>
                  {lawyers.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.full_name?.trim() || l.id.slice(0, 8)} ({l.role.replace(/_/g, " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-md border border-border bg-muted/20 p-3">
            {loadingMessages ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading messages…
              </p>
            ) : !lawyerId ? null : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet with {titleForLawyer}.</p>
            ) : (
              messages.map((m) => {
                const mine = currentUserId && m.sender_auth_user_id === currentUserId;
                return (
                  <div
                    key={m.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      mine ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-card border border-border"
                    }`}
                  >
                    <p className="text-xs opacity-80 mb-1">
                      {mine ? "You" : "Law firm"} · {new Date(m.created_at).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Write your message…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              disabled={!lawyerId || sending}
              className="resize-none"
            />
            <Button type="button" onClick={() => void handleSend()} disabled={!lawyerId || sending || !content.trim()}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
