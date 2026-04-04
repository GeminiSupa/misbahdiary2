-- One-time proxy tokens for client portal magic links (email points to /client-login, not raw Supabase URL).
create table if not exists public.client_portal_magic_link_tokens (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique,
  supabase_action_link text not null,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_portal_magic_link_tokens_expires_at
  on public.client_portal_magic_link_tokens (expires_at);

alter table public.client_portal_magic_link_tokens enable row level security;
