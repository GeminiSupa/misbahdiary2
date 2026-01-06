"use server";

import { supabaseAdminClient } from "@/lib/supabase/admin";

type NotificationPayload = {
  firmId: string;
  title: string;
  message?: string | null;
  type?: string;
  userId?: string | null;
  link?: string | null;
  relatedEntity?: string | null;
  relatedId?: string | null;
};

export async function createNotification({
  firmId,
  title,
  message = null,
  type = "info",
  userId = null,
  link = null,
  relatedEntity = null,
  relatedId = null,
}: NotificationPayload) {
  await supabaseAdminClient.from("notifications").insert({
    firm_id: firmId,
    title,
    message,
    type,
    user_id: userId,
    link,
    related_entity: relatedEntity,
    related_id: relatedId,
  });
}

export async function createNotificationsForRecipients(
  payload: Omit<NotificationPayload, "userId">,
  recipientIds: string[],
) {
  if (recipientIds.length === 0) {
    await createNotification(payload);
    return;
  }

  const rows = recipientIds.map((recipientId) => ({
    firm_id: payload.firmId,
    title: payload.title,
    message: payload.message ?? null,
    type: payload.type ?? "info",
    user_id: recipientId,
    link: payload.link ?? null,
    related_entity: payload.relatedEntity ?? null,
    related_id: payload.relatedId ?? null,
  }));

  await supabaseAdminClient.from("notifications").insert(rows);
}

