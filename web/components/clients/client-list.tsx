"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ClientListProps = {
  clients: Array<{
    id: string;
    fullName: string;
    type: string;
    organizationName: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
  }>;
};

export function ClientList({ clients }: ClientListProps) {
  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <h2 className="text-lg font-semibold text-foreground">Your clients</h2>
          <p className="text-sm text-muted-foreground">
            Directory of all individual and corporate clients linked to your matters.
          </p>
        </div>
        <div className="space-y-3">
          {clients.length === 0 ? (
            <div className="sap-subtle">
              <p className="font-medium text-foreground">No clients yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first client to start linking matters, documents, and invoices.
              </p>
            </div>
          ) : (
            clients.map((client) => (
              <article key={client.id} className="sap-tile space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{client.fullName}</h3>
                    {client.organizationName ? (
                      <p className="text-sm text-muted-foreground">
                        {client.organizationName}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {client.type}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {client.email ? <span>Email: {client.email}</span> : null}
                  {client.phone ? <span>Phone: {client.phone}</span> : null}
                  {client.city ? <span>City: {client.city}</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/clients/${client.id}`}>View details</Link>
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

