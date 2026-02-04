"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { MessageSquare, Users, Send, Inbox, Check, CheckCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { markMessageAsRead } from "@/app/(app)/messages/actions";

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
    role: string | null;
  };
  recipient?: {
    id: string;
    full_name: string | null;
    role: string | null;
  } | null;
};

type MessagesListProps = {
  messages: Message[];
  currentUserId: string;
  firmId: string;
};

export function MessagesList({ messages: initialMessages, currentUserId, firmId }: MessagesListProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [markedReadIds, setMarkedReadIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getBrowserClient();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    // Scroll to bottom on mount
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Subscribe to new messages - filter by firm_id and user relevance
    const channel = supabase
      .channel(`messages-${firmId}-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `firm_id=eq.${firmId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Only add message if it's relevant to current user
          const isRelevant = 
            newMessage.sender_id === currentUserId ||
            newMessage.recipient_id === currentUserId ||
            newMessage.recipient_id === null; // Group message

          if (isRelevant) {
            // Fetch the new message with relations
            const { data: messageWithRelations } = await supabase
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
              .eq("id", newMessage.id)
              .single();

            if (messageWithRelations) {
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some(m => m.id === messageWithRelations.id)) {
                  return prev;
                }
                return [messageWithRelations, ...prev].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `firm_id=eq.${firmId}`,
        },
        async (payload) => {
          const updatedMessage = payload.new as any;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id
                ? { ...msg, is_read: updatedMessage.is_read, read_at: updatedMessage.read_at }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, firmId, currentUserId]);

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
  const isReceivedMessage = (message: Message) => 
    !isMyMessage(message) && !isGroupMessage(message);

  // Filter messages based on active tab
  const filteredMessages = messages.filter((message) => {
    if (activeTab === "all") return true;
    if (activeTab === "sent") return isMyMessage(message) && !isGroupMessage(message);
    if (activeTab === "received") return isReceivedMessage(message);
    if (activeTab === "group") return isGroupMessage(message);
    return true;
  });

  const sentCount = messages.filter(m => isMyMessage(m) && !isGroupMessage(m)).length;
  const receivedCount = messages.filter(m => isReceivedMessage(m)).length;
  const groupCount = messages.filter(m => isGroupMessage(m)).length;

  // Mark received messages as read when viewing them
  useEffect(() => {
    const unreadReceivedMessages = messages.filter(
      (m) => isReceivedMessage(m) && !m.is_read && !markedReadIds.has(m.id)
    );

    if (unreadReceivedMessages.length > 0) {
      // Mark messages as read with a small delay to avoid too many requests
      const timeoutIds: NodeJS.Timeout[] = [];
      
      unreadReceivedMessages.forEach((message) => {
        const timeoutId = setTimeout(() => {
          setMarkedReadIds((prev) => new Set(prev).add(message.id));
          startTransition(async () => {
            const result = await markMessageAsRead(message.id);
            if (result.success) {
              // Update local state
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === message.id
                    ? { ...msg, is_read: true, read_at: new Date().toISOString() }
                    : msg
                )
              );
              router.refresh();
            }
          });
        }, 500); // Small delay to batch requests
        timeoutIds.push(timeoutId);
      });

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id));
      };
    }
  }, [messages, markedReadIds, router]);

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-4 pb-2 border-b">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex min-w-max gap-1 rounded-full bg-muted/60 px-1 py-1 sm:w-full sm:min-w-0 sm:grid sm:grid-cols-4">
            <TabsTrigger value="all" className="relative">
              All
              {messages.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {messages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="relative">
              <Send className="h-3 w-3 mr-1" />
              Sent
              {sentCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {sentCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="relative">
              <Inbox className="h-3 w-3 mr-1" />
              Received
              {receivedCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {receivedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="group" className="relative">
              <Users className="h-3 w-3 mr-1" />
              Group
              {groupCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {groupCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          </div>
        </div>

        <TabsContent value={activeTab} className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="flex-1 h-full" ref={scrollRef}>
            <div className="space-y-4 p-4">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === "all" && "No messages yet"}
                    {activeTab === "sent" && "No sent messages"}
                    {activeTab === "received" && "No received messages"}
                    {activeTab === "group" && "No group messages"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {activeTab === "all" && "Start a conversation with your team members"}
                    {activeTab === "sent" && "Messages you send will appear here"}
                    {activeTab === "received" && "Messages sent to you will appear here"}
                    {activeTab === "group" && "Group messages will appear here"}
                  </p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-lg border",
                      isMyMessage(message)
                        ? "bg-primary/5 border-primary/20 ml-auto max-w-[80%]"
                        : "bg-muted/50 mr-auto max-w-[80%]",
                      !message.is_read && !isMyMessage(message) && "border-primary/40 bg-primary/10 ring-2 ring-primary/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {isGroupMessage(message) && (
                            <Users className="h-3 w-3 text-muted-foreground" />
                          )}
                          {isMyMessage(message) && !isGroupMessage(message) && (
                            <Send className="h-3 w-3 text-primary" />
                          )}
                          {isReceivedMessage(message) && (
                            <Inbox className="h-3 w-3 text-info" />
                          )}
                          <span className="text-sm font-semibold">
                            {isMyMessage(message)
                              ? "You"
                              : message.sender?.full_name || "Unknown"}
                          </span>
                          <Badge 
                            variant={isMyMessage(message) ? "default" : "outline"} 
                            className="text-xs"
                          >
                            {getMessageLabel(message)}
                          </Badge>
                          {isMyMessage(message) && !isGroupMessage(message) && (
                            <span className="text-xs text-muted-foreground">
                              {message.is_read ? (
                                <CheckCheck className="h-3 w-3 text-primary inline" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground inline" />
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), "MMM d, yyyy 'at' h:mm a")}
                        {" • "}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
