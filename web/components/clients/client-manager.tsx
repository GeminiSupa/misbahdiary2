"use client";

import { ClientList } from "@/components/clients/client-list";

type ClientRecord = {
  id: string;
  full_name: string;
  name: string | null;
  father_name: string | null;
  type: string;
  representation: string | null;
  representative_details: { to_whom?: string | null; capacity?: string | null } | null;
  organization_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  cnic: string | null;
  notes: string | null;
};

type ClientManagerProps = {
  clients: ClientRecord[];
};

export function ClientManager({ clients }: ClientManagerProps) {
  return (
    <ClientList
      clients={clients.map((client) => ({
        id: client.id,
        fullName: client.full_name ?? client.name,
        type: client.type,
        organizationName: client.organization_name,
        email: client.email,
        phone: client.phone,
        city: client.city,
      }))}
    />
  );
}

