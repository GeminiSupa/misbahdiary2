// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

type HearingReminder = {
  id: string;
  firm_id: string;
  scheduled_at: string;
  matter: { serial_number: string | null; case_number: string | null } | null;
};

type InvoiceReminder = {
  id: string;
  firm_id: string;
  invoice_number: string;
  due_date: string | null;
  status: string;
  total_amount: number;
  amount_paid: number | null;
};

serve(async () => {
  const now = new Date();
  const nowIso = now.toISOString();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: hearings } = await supabase
    .from("hearings")
    .select(
      `
        id,
        firm_id,
        scheduled_at,
        reminder_sent_at,
        matter:matters (
          serial_number,
          case_number
        )
      `,
    )
    .eq("status", "scheduled")
    .is("reminder_sent_at", null)
    .gte("scheduled_at", nowIso)
    .lte("scheduled_at", in24Hours);

  if (hearings && hearings.length > 0) {
    for (const hearing of hearings as HearingReminder[]) {
      const recipients = await getRecipientsForPreference(hearing.firm_id, "hearing_reminders");

      await createReminderNotifications({
        firmId: hearing.firm_id,
        title: "Upcoming hearing",
        message: `Hearing for ${hearing.matter?.serial_number ?? hearing.matter?.case_number ?? "matter"} starts at ${new Date(
          hearing.scheduled_at,
        ).toLocaleString()}.`,
        type: "hearing_reminder",
        relatedId: hearing.id,
        recipients,
        emailSubject: `Hearing reminder: ${hearing.matter?.serial_number ?? hearing.matter?.case_number ?? "Matter"}`,
        emailBody: `Hearing scheduled for ${new Date(hearing.scheduled_at).toLocaleString()}.\n\nMatter reference: ${
          hearing.matter?.serial_number ?? hearing.matter?.case_number ?? "N/A"
        }.\nPlease confirm your availability.`,
      });

      await supabase
        .from("hearings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", hearing.id);
    }
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, firm_id, invoice_number, due_date, status, total_amount, amount_paid, reminder_sent_at")
    .in("status", ["sent", "overdue"])
    .is("reminder_sent_at", null)
    .not("due_date", "is", null)
    .gte("due_date", today)
    .lte("due_date", tomorrow);

  if (invoices && invoices.length > 0) {
    for (const invoice of invoices as InvoiceReminder[]) {
      const outstanding = Math.max(
        Number(invoice.total_amount ?? 0) - Number(invoice.amount_paid ?? 0),
        0,
      );
      const formattedOutstanding = new Intl.NumberFormat("en-US").format(outstanding);

      const recipients = await getRecipientsForPreference(invoice.firm_id, "invoice_reminders");

      await createReminderNotifications({
        firmId: invoice.firm_id,
        title: "Invoice due soon",
        message: `Invoice ${invoice.invoice_number} is due on ${invoice.due_date}. Outstanding balance: PKR ${formattedOutstanding}.`,
        type: "invoice_reminder",
        relatedId: invoice.id,
        recipients,
        emailSubject: `Invoice due: ${invoice.invoice_number}`,
        emailBody: `Invoice ${invoice.invoice_number} is due on ${invoice.due_date}. Outstanding balance: PKR ${formattedOutstanding}.\n\nPlease review and arrange payment.`,
      });

      await supabase
        .from("invoices")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", invoice.id);
    }
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function createReminderNotifications({
  firmId,
  title,
  message,
  type,
  relatedId,
  recipients,
  emailSubject,
  emailBody,
}: {
  firmId: string;
  title: string;
  message: string;
  type: string;
  relatedId: string;
  recipients: string[];
  emailSubject?: string;
  emailBody?: string;
}) {
  if (recipients.length === 0) {
    await supabase.from("notifications").insert({
      firm_id: firmId,
      title,
      message,
      type,
      related_entity: type,
      related_id: relatedId,
    });
    return;
  }

  const rows = recipients.map((userId) => ({
    firm_id: firmId,
    title,
    message,
    type,
    related_entity: type,
    related_id: relatedId,
    user_id: userId,
  }));

  await supabase.from("notifications").insert(rows);

  if (RESEND_API_KEY && RESEND_FROM_EMAIL && emailSubject && emailBody) {
    const emails = await getEmailsForProfiles(recipients);
    await Promise.all(
      emails.map((email) =>
        sendEmail({
          to: email,
          subject: emailSubject,
          text: `${message}\n\n${emailBody}`,
        }),
      ),
    );
  }
}

async function getRecipientsForPreference(
  firmId: string,
  preference: "hearing_reminders" | "invoice_reminders",
) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select(
      `
        profile_id,
        profiles!inner ( firm_id )
      `,
    )
    .eq(preference, true)
    .eq("profiles.firm_id", firmId);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.profile_id as string);
}

async function getEmailsForProfiles(profileIds: string[]) {
  const results: string[] = [];
  for (const id of profileIds) {
    const { data } = await supabase.auth.admin.getUserById(id);
    if (data?.user?.email) {
      results.push(data.user.email);
    }
  }
  return results;
}

async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      text,
    }),
  }).catch((error) => {
    console.error("Failed to send reminder email", error);
  });
}

