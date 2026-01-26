"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export async function sendMessage({
  firmId,
  recipientId,
  content,
}: {
  firmId: string;
  recipientId: string | null;
  content: string;
}): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  // Verify user belongs to this firm
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .eq("firm_id", firmId)
    .maybeSingle();

  if (!profile) {
    return { message: "Access denied. You don't belong to this firm." };
  }

  // If recipient is specified, verify they're in the same firm
  if (recipientId) {
    const { data: recipient } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", recipientId)
      .eq("firm_id", firmId)
      .maybeSingle();

    if (!recipient) {
      return { message: "Recipient not found or not in your firm." };
    }
  }

  // Create message
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      firm_id: firmId,
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return {
      message: error.message || "Failed to send message",
    };
  }

  revalidatePath("/messages");
  return { success: true, data: message };
}

export async function markMessageAsRead(messageId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  // Verify user is the recipient
  const { data: message } = await supabase
    .from("messages")
    .select("recipient_id")
    .eq("id", messageId)
    .single();

  if (!message || message.recipient_id !== user.id) {
    return { message: "Access denied." };
  }

  // Mark as read
  const { error } = await supabase
    .from("messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("recipient_id", user.id);

  if (error) {
    console.error("Error marking message as read:", error);
    return {
      message: error.message || "Failed to mark message as read",
    };
  }

  revalidatePath("/messages");
  return { success: true };
}
