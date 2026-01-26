"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { MessageSquare, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    role: string;
  };
  recipient?: {
    id: string;
    full_name: string | null;
    role: string;
  } | null;
};

type MessagesListProps = {
  messages: Message[];
  currentUserId: string;
};

export function MessagesList({ messages: initialMessages, currentUserId }: MessagesListProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getBrowserClient();

  useEffect(() => {
    // Scroll to bottom on mount
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          // Fetch the new message with relations
          const { data: newMessage } = await supabase
            .from("messages")
            .select(`
              id,
              sender_id,
              recipient_id,
              content,
              is_read,
              created_at,
              sender:profiles!messages_sender_id_fkey(id, full_name, role),
              recipient:profiles!messages_recipient_id_fkey(id, full_name, role)
            `)
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [newMessage, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const getMessageLabel = (message: Message) => {
    if (message.recipient_id === null) {
      return "Group Message";
    }
    if (message.sender_id === currentUserId) {
      return `To: ${message.recipient?.full_name || "Unknown"}`;
    }
    return `From: ${message.sender?.full_name || "Unknown"}`;
  };

  const isMyMessage = (message: Message) => message.sender_id === currentUserId;
  const isGroupMessage = (message: Message) => message.recipient_id === null;

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start a conversation with your team members
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-2 p-4 rounded-lg border",
                isMyMessage(message)
                  ? "bg-primary/5 border-primary/20 ml-auto max-w-[80%]"
                  : "bg-muted/50 mr-auto max-w-[80%]",
                !message.is_read && !isMyMessage(message) && "border-primary/40 bg-primary/10"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isGroupMessage(message) && (
                      <Users className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-sm font-semibold">
                      {isMyMessage(message)
                        ? "You"
                        : message.sender?.full_name || "Unknown"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getMessageLabel(message)}
                    </Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {!message.is_read && !isMyMessage(message) && (
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
