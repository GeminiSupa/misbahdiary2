import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import { ClientPdfDocument } from "@/lib/pdf/client-pdf";
import { createElement } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeStyle: "short",
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const clientId = id;

    if (!clientId) {
      return NextResponse.json({ message: "Client ID is required" }, { status: 400 });
    }

    // Fetch client data
    const { data: client, error: clientError } = await supabaseAdminClient
      .from("clients")
      .select("id, firm_id, type, name, full_name, father_name, representation, representative_details, organization_name, email, phone, address, city, province, country, cnic, notes")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) {
      console.error("Error fetching client:", {
        message: clientError.message,
        details: clientError.details,
        hint: clientError.hint,
        code: clientError.code,
      });
      return NextResponse.json({ message: "Error fetching client data" }, { status: 500 });
    }

    if (!client) {
      return NextResponse.json({ message: "Client not found" }, { status: 404 });
    }

    // Type assertion for client data
    const clientData = client as unknown as {
      firm_id: string;
      full_name?: string | null;
      name?: string | null;
      type?: string | null;
      organization_name?: string | null;
      father_name?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      province?: string | null;
      country?: string | null;
      cnic?: string | null;
      representation?: string | null;
      representative_details?: any;
      notes?: string | null;
    };

    // Fetch firm data
    const { data: firm } = await supabaseAdminClient
      .from("firms")
      .select("name, address")
      .eq("id", clientData.firm_id)
      .maybeSingle();

    // Fetch related matters separately
    const { data: matters } = await supabaseAdminClient
      .from("matters")
      .select("id, serial_number, matter_status, matter_type, case_number, court_name, district")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    const generatedAt = dateFormatter.format(new Date());

    const pdfElement = createElement(ClientPdfDocument, {
      firmName: firm?.name ?? "Lawyer Diary",
      firmAddress: firm?.address ?? undefined,
      clientName: clientData.full_name ?? clientData.name ?? "Client",
      clientType: clientData.type ?? "individual",
      organizationName: clientData.organization_name ?? undefined,
      fatherName: clientData.father_name ?? undefined,
      email: clientData.email ?? undefined,
      phone: clientData.phone ?? undefined,
      address: clientData.address ?? undefined,
      city: clientData.city ?? undefined,
      province: clientData.province ?? undefined,
      country: clientData.country ?? undefined,
      cnic: clientData.cnic ?? undefined,
      representation: clientData.representation ?? undefined,
      representativeDetails: clientData.representative_details ?? undefined,
      notes: clientData.notes ?? undefined,
      matters: (matters ?? []).map((matter) => ({
        serial_number: matter.serial_number,
        matter_status: matter.matter_status,
        matter_type: matter.matter_type,
        case_number: matter.case_number,
        court_name: matter.court_name,
        district: matter.district,
      })),
      generatedAt,
    });

    const pdfBuffer = await renderToBuffer(pdfElement as any);

    const clientNameSlug = (clientData.full_name ?? clientData.name ?? "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="client-${clientNameSlug}-${clientId.slice(0, 8)}.pdf"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error generating PDF:", error);
    }
    return NextResponse.json(
      {
        message: "Error generating PDF",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

