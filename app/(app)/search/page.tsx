import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = (resolvedSearchParams.q ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !query) {
    return (
      <div className="sap-card">
        <div className="sap-card-body space-y-3">
          <div className="sap-card-header">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Search</h1>
              <p className="text-sm text-muted-foreground">
                Type a case number, client name, or invoice number into the search bar in the
                header to find records.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return null;
  }

  const likeQuery = `%${query}%`;

  const [mattersRes, clientsRes, invoicesRes] = await Promise.all([
    supabase
      .from("matters")
      .select("id, serial_number, case_number, court_name")
      .eq("firm_id", profile.firm_id)
      .ilike("serial_number", likeQuery)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("clients")
      .select("id, full_name, name, cnic, email")
      .eq("firm_id", profile.firm_id)
      .or(
        `full_name.ilike.${likeQuery},name.ilike.${likeQuery},cnic.ilike.${likeQuery},email.ilike.${likeQuery}`,
      )
      .limit(10),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total_amount")
      .eq("firm_id", profile.firm_id)
      .ilike("invoice_number", likeQuery)
      .order("issue_date", { ascending: false })
      .limit(10),
  ]);

  const matters = mattersRes.data ?? [];
  // Type assertion needed due to TypeScript type inference issues
  const clients = (clientsRes.data as Array<{ id: string; full_name?: string | null; name?: string | null; cnic?: string | null; email?: string | null }> | null) ?? [];
  const invoices = invoicesRes.data ?? [];

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-6">
        <div className="sap-card-header">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Search results for “{query}”
            </h1>
            <p className="text-sm text-muted-foreground">
              Showing matches across matters, clients, and invoices.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Matters</h2>
          {matters.length === 0 ? (
            <div className="sap-subtle text-xs text-muted-foreground">
              No matters match this query.
            </div>
          ) : (
            <div className="divide-y rounded-xl border border-border/60 bg-card/95">
              {matters.map((matter) => (
                <Link
                  key={matter.id}
                  href={`/cases/${matter.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/60"
                >
                  <div>
                    <p className="font-medium">
                      {matter.serial_number || matter.case_number || "Matter"}
                    </p>
                    {matter.court_name ? (
                      <p className="text-xs text-muted-foreground">{matter.court_name}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Clients</h2>
          {clients.length === 0 ? (
            <div className="sap-subtle text-xs text-muted-foreground">
              No clients match this query.
            </div>
          ) : (
            <div className="divide-y rounded-xl border border-border/60 bg-card/95">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/60"
                >
                  <div>
                    <p className="font-medium">
                      {client.full_name ?? client.name ?? "Client"}
                    </p>
                    {(client.cnic || client.email) && (
                      <p className="text-xs text-muted-foreground">
                        {[client.cnic, client.email].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Invoices</h2>
          {invoices.length === 0 ? (
            <div className="sap-subtle text-xs text-muted-foreground">
              No invoices match this query.
            </div>
          ) : (
            <div className="divide-y rounded-xl border border-border/60 bg-card/95">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.status} • PKR{" "}
                      {Number(invoice.total_amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


