"use server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@lawerdiary.com";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000");
}

type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn("Email service not configured. Missing RESEND_API_KEY or RESEND_FROM_EMAIL.");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
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
        html: html || text.replace(/\n/g, "<br>"),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email:", error);
      return { success: false, error: "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendInvitationEmail(email: string, role: string, token: string, inviterName?: string): Promise<void> {
  const invitationLink = `${getSiteUrl()}/invite/${token}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

  const subject = `Invitation to join ${inviterName ? `${inviterName}'s` : "a"} law firm workspace`;
  const text = `You have been invited to join a law firm workspace.

Role: ${role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
Invited by: ${inviterName || "A team member"}

Click the link below to accept the invitation:
${invitationLink}

This invitation will expire on ${expiresAt}.

If you did not expect this invitation, you can safely ignore this email.`;

  await sendEmail({ to: email, subject, text });
}

export async function sendUserCreatedEmail(email: string, password: string, fullName: string, firmName: string): Promise<void> {
  const subject = `Welcome to ${firmName} - Your account has been created`;
  const text = `Hello ${fullName},

Your account has been created for ${firmName}.

Email: ${email}
Temporary Password: ${password}

Please sign in and change your password immediately:
${getSiteUrl()}/sign-in

For security reasons, we recommend changing your password on first login.

If you have any questions, please contact your administrator.`;

  await sendEmail({ to: email, subject, text });
}

export async function sendClientPortalProxyLoginEmail(
  to: string,
  clientLoginUrl: string,
): Promise<{ success: boolean; error?: string }> {
  const subject = "Your client portal login link";
  const text = `You requested access to your client portal.

Open this page in your browser, then click the button to continue (this avoids the login link being used by automated email scanners):

${clientLoginUrl}

This link expires in 15 minutes. If you did not request this, you can ignore this email.`;

  const html = `
  <p>You requested access to your client portal.</p>
  <p><a href="${clientLoginUrl}" style="color:#2563eb;font-weight:600;">Open your secure login page</a></p>
  <p style="color:#64748b;font-size:14px;">After the page opens, use the button <strong>Continue to your dashboard</strong> to complete sign-in. This two-step flow keeps your one-time link safe from automated scanners.</p>
  <p style="color:#64748b;font-size:14px;">This link expires in 15 minutes.</p>
`;

  return sendEmail({ to, subject, text, html });
}

export async function sendPasswordChangeNotification(email: string, userName: string, timestamp: string): Promise<void> {
  const subject = "Password Changed - Security Notification";
  const text = `Hello ${userName},

Your password was successfully changed on ${timestamp}.

If you did not make this change, please contact support immediately and change your password.

If you made this change, you can safely ignore this email.`;

  await sendEmail({ to: email, subject, text });
}
