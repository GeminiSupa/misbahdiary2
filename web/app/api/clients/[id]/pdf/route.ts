import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import { ClientPdfDocument } from "@/lib/pdf/client-pdf";
import { createElement } from "react";

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

    // Fetch firm data
    const clientData = client as unknown as { firm_id: string };
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
      clientName: client.full_name ?? client.name ?? "Client",
      clientType: client.type ?? "individual",
      organizationName: client.organization_name ?? undefined,
      fatherName: client.father_name ?? undefined,
      email: client.email ?? undefined,
      phone: client.phone ?? undefined,
      address: client.address ?? undefined,
      city: client.city ?? undefined,
      province: client.province ?? undefined,
      country: client.country ?? undefined,
      cnic: client.cnic ?? undefined,
      representation: client.representation ?? undefined,
      representativeDetails: (client.representative_details as any) ?? undefined,
      notes: client.notes ?? undefined,
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

    const stream = await renderToStream(pdfElement as any);

    const clientNameSlug = (client.full_name ?? client.name ?? "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=client-${clientNameSlug}-${clientId.slice(0, 8)}.pdf`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      {
        message: "Error generating PDF",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

