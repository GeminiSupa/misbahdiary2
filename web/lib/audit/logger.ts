"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

type AuditLogData = {
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
};

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Don't log if user is not authenticated
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.firm_id) {
      // Don't log if user doesn't have a firm
      return;
    }

    // Get IP address and user agent from headers
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Use admin client to insert audit log (bypasses RLS)
    // @ts-expect-error - audit_logs table not in TypeScript types yet
    await (supabaseAdminClient as any).from("audit_logs").insert({
      firm_id: profile.firm_id,
      user_id: user.id,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId || null,
      details: data.details || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    // Don't fail the operation if audit logging fails
    console.error("Failed to log audit event:", error);
  }
}

// Convenience functions for common audit events
export async function logUserCreated(userId: string, email: string, role: string): Promise<void> {
  await logAuditEvent({
    action: "user_created",
    entityType: "user",
    entityId: userId,
    details: { email, role },
  });
}

export async function logUserDeleted(userId: string, email: string): Promise<void> {
  await logAuditEvent({
    action: "user_deleted",
    entityType: "user",
    entityId: userId,
    details: { email },
  });
}

export async function logClientCreated(clientId: string, clientName: string): Promise<void> {
  await logAuditEvent({
    action: "client_created",
    entityType: "client",
    entityId: clientId,
    details: { name: clientName },
  });
}

export async function logClientDeleted(clientId: string, clientName: string): Promise<void> {
  await logAuditEvent({
    action: "client_deleted",
    entityType: "client",
    entityId: clientId,
    details: { name: clientName },
  });
}

export async function logMatterCreated(matterId: string, serialNumber: string): Promise<void> {
  await logAuditEvent({
    action: "matter_created",
    entityType: "matter",
    entityId: matterId,
    details: { serial_number: serialNumber },
  });
}

export async function logMatterDeleted(matterId: string, serialNumber: string): Promise<void> {
  await logAuditEvent({
    action: "matter_deleted",
    entityType: "matter",
    entityId: matterId,
    details: { serial_number: serialNumber },
  });
}

export async function logInvoiceCreated(invoiceId: string, invoiceNumber: string): Promise<void> {
  await logAuditEvent({
    action: "invoice_created",
    entityType: "invoice",
    entityId: invoiceId,
    details: { invoice_number: invoiceNumber },
  });
}

export async function logInvoiceDeleted(invoiceId: string, invoiceNumber: string): Promise<void> {
  await logAuditEvent({
    action: "invoice_deleted",
    entityType: "invoice",
    entityId: invoiceId,
    details: { invoice_number: invoiceNumber },
  });
}

export async function logInvoiceVoided(invoiceId: string, invoiceNumber: string): Promise<void> {
  await logAuditEvent({
    action: "invoice_voided",
    entityType: "invoice",
    entityId: invoiceId,
    details: { invoice_number: invoiceNumber },
  });
}

export async function logPasswordChanged(userId: string): Promise<void> {
  await logAuditEvent({
    action: "password_changed",
    entityType: "user",
    entityId: userId,
    details: {},
  });
}
