import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/service";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid form data. Please check your input." },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    // Send email to support
    const emailSubject = `Contact Form: ${subject}`;
    const emailText = `New contact form submission from Lawyer Diary:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent from the Lawyer Diary contact form.`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">This message was sent from the Lawyer Diary contact form.</p>
      </div>
    `;

    const result = await sendEmail({
      to: "info@ux4u.online",
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || "Failed to send message. Please try again later or email us directly at info@ux4u.online" },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: "Thank you for contacting Lawyer Diary",
      text: `Hello ${name},

Thank you for contacting Lawyer Diary. We have received your message:

Subject: ${subject}

We will get back to you as soon as possible.

Best regards,
Lawyer Diary Support Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for contacting us!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for contacting Lawyer Diary. We have received your message:</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <p>We will get back to you as soon as possible.</p>
          <p>Best regards,<br>Lawyer Diary Support Team</p>
        </div>
      `,
    }).catch((error) => {
      // Don't fail the request if confirmation email fails
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to send confirmation email:", error);
      }
    });

    return NextResponse.json(
      { success: true, message: "Your message has been sent successfully. We'll get back to you soon!" },
      { status: 200 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Contact form error:", error);
    }
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again later or email us directly at info@ux4u.online" },
      { status: 500 }
    );
  }
}
