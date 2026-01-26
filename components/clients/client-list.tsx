"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteClientButton } from "@/components/clients/delete-client-button";

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
  if (!clients || clients.length === 0) {
    return (
      <div className="sap-card">
        <div className="sap-card-body space-y-4">
          <div className="sap-card-header">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Your clients</h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Directory of all individual and corporate clients linked to your matters.
              </p>
            </div>
          </div>
          <div className="sap-subtle">
            <p className="text-sm font-medium text-foreground sm:text-base">No clients yet</p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Create your first client to start linking matters, documents, and invoices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-3 sm:space-y-4">
        <div className="sap-card-header">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Your clients</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Directory of all individual and corporate clients linked to your matters. ({clients.length} {clients.length === 1 ? "client" : "clients"})
            </p>
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {clients.map((client) => (
            <article key={client.id} className="sap-tile space-y-2 sm:space-y-3 overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3 className="text-sm font-semibold text-foreground sm:text-base truncate" title={client.fullName}>{client.fullName}</h3>
                  {client.organizationName ? (
                    <p className="text-xs text-muted-foreground sm:text-sm truncate" title={client.organizationName}>
                      {client.organizationName}
                    </p>
                  ) : null}
                </div>
                <Badge variant="outline" className="capitalize flex-shrink-0 text-[10px] sm:text-xs whitespace-nowrap">
                  {client.type}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground sm:gap-x-4 sm:gap-y-2 sm:text-sm">
                {client.email ? <span className="truncate max-w-full" title={client.email}>Email: {client.email}</span> : null}
                {client.phone ? <span className="truncate max-w-full" title={client.phone}>Phone: {client.phone}</span> : null}
                {client.city ? <span className="truncate max-w-full" title={client.city}>City: {client.city}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-initial min-w-0">
                  <Link href={`/clients/${client.id}`} className="truncate">View details</Link>
                </Button>
                <DeleteClientButton
                  clientId={client.id}
                  clientName={client.fullName}
                  size="sm"
                  className="flex-1 sm:flex-initial"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

