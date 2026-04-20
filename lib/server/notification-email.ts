"use server";

import { sendEmail } from "@/lib/email/service";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import type { NotificationPreferenceKey } from "@/lib/server/preferences";

function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function siteOrigin(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return base.replace(/\/$/, "");
}

async function emailsForProfileIds(profileIds: string[]): Promise<string[]> {
  const unique = Array.from(new Set(profileIds)).filter(Boolean);
  if (unique.length === 0) return [];

  // Supabase Auth emails live in auth.users; use admin API per user.
  const results = await Promise.all(
    unique.map(async (id) => {
      const { data, error } = await supabaseAdminClient.auth.admin.getUserById(id);
      if (error) return null;
      const email = data.user?.email?.trim();
      return email || null;
    }),
  );
  return results.filter((e): e is string => Boolean(e));
}

export async function sendFirmEmailByPreference(options: {
  firmId: string;
  preference: NotificationPreferenceKey;
  subject: string;
  text: string;
  /** Optional relative link appended to the email. */
  linkPath?: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const { data: rows } = await supabaseAdminClient
    .from("notification_preferences")
    .select("profile_id, hearing_reminders, invoice_reminders, announcement_updates")
    .in("profile_id",
      (
        await supabaseAdminClient
          .from("profiles")
          .select("id")
          .eq("firm_id", options.firmId)
      ).data?.map((r) => r.id) ?? [],
    );

  const allowedIds =
    (rows ?? [])
      .filter((r) => {
        if (options.preference === "hearing_reminders") return Boolean(r.hearing_reminders);
        if (options.preference === "invoice_reminders") return Boolean(r.invoice_reminders);
        return Boolean(r.announcement_updates);
      })
      .map((r) => r.profile_id) ?? [];

  const toEmails = await emailsForProfileIds(allowedIds);
  if (toEmails.length === 0) return;

  const url =
    options.linkPath && options.linkPath.startsWith("/")
      ? `${siteOrigin()}${options.linkPath}`
      : null;

  const text = url ? `${options.text}\n\nOpen: ${url}\n` : options.text;

  // Send individually to avoid leaking addresses between firm members.
  await Promise.all(toEmails.map((to) => sendEmail({ to, subject: options.subject, text })));
}

export async function sendClientEmail(options: {
  clientId: string;
  subject: string;
  text: string;
  linkPath?: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const { data: client } = await supabaseAdminClient
    .from("clients")
    .select("id, email, portal_enabled")
    .eq("id", options.clientId)
    .maybeSingle();

  const to = client?.email?.trim();
  if (!to) return;

  const url =
    options.linkPath && options.linkPath.startsWith("/")
      ? `${siteOrigin()}${options.linkPath}`
      : null;
  const text = url ? `${options.text}\n\nOpen: ${url}\n` : options.text;

  await sendEmail({ to, subject: options.subject, text });
}

