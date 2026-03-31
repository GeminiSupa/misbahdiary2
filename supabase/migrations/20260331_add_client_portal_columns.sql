-- Add client portal identity columns (additive, production-safe).
alter table public.clients
  add column if not exists auth_user_id uuid null,
  add column if not exists portal_enabled boolean not null default false;

-- Ensure one auth user can only map to one client.
create unique index if not exists clients_auth_user_id_unique_idx
  on public.clients (auth_user_id)
  where auth_user_id is not null;
