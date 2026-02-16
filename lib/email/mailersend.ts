/**
 * MailerSend integration for transactional emails:
 * - Welcome email after onboarding
 * - Subscription success email after payment
 *
 * Requires: MAILERSEND_API_KEY, and a verified sender (MAILERSEND_FROM_EMAIL / MAILERSEND_FROM_NAME).
 */

import {
  MailerSend as MailerSendClient,
  EmailParams,
  Sender,
  Recipient,
} from "mailersend";

const API_KEY = process.env.MAILERSEND_API_KEY;
const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || "noreply@lawerdiary.com";
const FROM_NAME = process.env.MAILERSEND_FROM_NAME || "Lawyer Diary";

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function getClient(): MailerSendClient | null {
  if (!API_KEY) return null;
  return new MailerSendClient({ apiKey: API_KEY });
}

/**
 * Send welcome email after user completes onboarding (firm created, profile set).
 */
export async function sendWelcomeEmail(
  toEmail: string,
  recipientName: string
): Promise<{ success: boolean; error?: string }> {
  const client = getClient();
  if (!client) {
    if (process.env.NODE_ENV === "development") {
      console.warn("MailerSend: MAILERSEND_API_KEY not set. Skipping welcome email.");
    }
    return { success: false, error: "MailerSend not configured" };
  }

  const loginUrl = `${getSiteUrl()}/sign-in`;
  const dashboardUrl = `${getSiteUrl()}/dashboard`;

  const subject = "Welcome to Lawyer Diary";
  const html = `
    <div style="font-family: sans-serif; max-width: 560px;">
      <h2 style="color: #1a1a1a;">Welcome to Lawyer Diary</h2>
      <p>Hi ${recipientName},</p>
      <p>Your account and firm are set up. You can now sign in and start using the app.</p>
      <ul>
        <li>Manage cases, clients, and hearings</li>
        <li>Create invoices and track billing</li>
        <li>Collaborate with your team</li>
      </ul>
      <p>You're on a <strong>30-day free trial</strong>. Subscribe before it ends to keep full access.</p>
      <p>
        <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Sign in</a>
        &nbsp;
        <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
      </p>
      <p style="color: #64748b; font-size: 14px;">If you didn't create this account, you can ignore this email.</p>
    </div>
  `;
  const text = `Welcome to Lawyer Diary\n\nHi ${recipientName},\n\nYour account and firm are set up. Sign in at ${loginUrl} or go to your dashboard at ${dashboardUrl}.\n\nYou're on a 30-day free trial. Subscribe before it ends to keep full access.\n\nIf you didn't create this account, you can ignore this email.`;

  try {
    const sentFrom = new Sender(FROM_EMAIL, FROM_NAME);
    const recipients = [new Recipient(toEmail, recipientName || "User")];
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await client.email.send(emailParams);
    return { success: true };
  } catch (err) {
    console.error("MailerSend welcome email error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send welcome email",
    };
  }
}

/**
 * Send subscription success email after Stripe checkout (recurring or one-time).
 */
export async function sendSubscriptionSuccessEmail(
  toEmail: string,
  recipientName: string,
  planName?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getClient();
  if (!client) {
    if (process.env.NODE_ENV === "development") {
      console.warn("MailerSend: MAILERSEND_API_KEY not set. Skipping subscription success email.");
    }
    return { success: false, error: "MailerSend not configured" };
  }

  const dashboardUrl = `${getSiteUrl()}/dashboard`;
  const subscriptionUrl = `${getSiteUrl()}/subscription`;
  const planLabel = planName ? ` (${planName})` : "";

  const subject = "You're subscribed – Lawyer Diary";
  const html = `
    <div style="font-family: sans-serif; max-width: 560px;">
      <h2 style="color: #1a1a1a;">Subscription successful</h2>
      <p>Hi ${recipientName},</p>
      <p>Your subscription to Lawyer Diary${planLabel} is now active. Thank you for subscribing.</p>
      <p>You have full access to:</p>
      <ul>
        <li>Cases and client management</li>
        <li>Billing and invoices</li>
        <li>Calendar and hearings</li>
        <li>Team and settings</li>
      </ul>
      <p>Your subscription will renew automatically each month. You can manage billing and plan at any time from your account.</p>
      <p>
        <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
        &nbsp;
        <a href="${subscriptionUrl}" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px;">Subscription & Billing</a>
      </p>
      <p style="color: #64748b; font-size: 14px;">If you have any questions, contact us at info@ux4u.online.</p>
    </div>
  `;
  const text = `Subscription successful\n\nHi ${recipientName},\n\nYour subscription to Lawyer Diary${planLabel} is now active. You have full access to cases, billing, calendar, and team features.\n\nManage your subscription: ${subscriptionUrl}\nDashboard: ${dashboardUrl}\n\nIf you have questions, contact info@ux4u.online.`;

  try {
    const sentFrom = new Sender(FROM_EMAIL, FROM_NAME);
    const recipients = [new Recipient(toEmail, recipientName || "User")];
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html)
      .setText(text);

    await client.email.send(emailParams);
    return { success: true };
  } catch (err) {
    console.error("MailerSend subscription success email error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send subscription email",
    };
  }
}
